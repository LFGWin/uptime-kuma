const { describe, test, before, after, beforeEach, mock } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const axios = require("axios");

const LFGAlarm = require("../../../server/notification-providers/lfg-alarm");
const { DOWN, UP } = require("../../../src/util");

const ALARM_LINK = "https://api.lfg.gm/horn/abcdefghijklmnopqrstuvwxyz012345";

describe("LFG Alarm notification provider", () => {
    let server;
    let baseUrl;
    let requests = [];
    let status = 200;
    let reply = {};

    before(async () => {
        const app = express();
        app.post("/horn/:code", (req, res) => {
            requests.push({ code: req.params.code });
            res.status(status).json(reply);
        });
        await new Promise((resolve) => {
            server = app.listen(0, "127.0.0.1", resolve);
        });
        baseUrl = `http://127.0.0.1:${server.address().port}`;

        // Point the https alarm link at the local mock instead of the real API.
        const post = axios.post;
        mock.method(axios, "post", (url, data, config) =>
            post(url.replace("https://api.lfg.gm", baseUrl), data, config)
        );
    });

    after(() => {
        mock.restoreAll();
        server.close();
    });

    beforeEach(() => {
        requests = [];
        status = 200;
        reply = { fired: true, wokeUp: 2, devices: 2 };
    });

    const notification = (extra) => ({ lfgAlarmUrl: ALARM_LINK, ...extra });

    test("send() rings the alarm when a monitor goes down", async () => {
        const result = await new LFGAlarm().send(notification(), "down", { name: "Site" }, { status: DOWN });

        assert.strictEqual(result, "Sent Successfully.");
        assert.strictEqual(requests.length, 1);
        assert.strictEqual(requests[0].code, "abcdefghijklmnopqrstuvwxyz012345");
    });

    test("send() rings the alarm for the test button and expiry warnings", async () => {
        const result = await new LFGAlarm().send(notification(), "test");

        assert.strictEqual(result, "Sent Successfully.");
        assert.strictEqual(requests.length, 1);
    });

    test("send() skips UP events when ringing on UP is off", async () => {
        const result = await new LFGAlarm().send(notification(), "up", { name: "Site" }, { status: UP });

        assert.match(result, /Not rung/);
        assert.strictEqual(requests.length, 0);
    });

    test("send() rings for UP events when ringing on UP is on", async () => {
        const result = await new LFGAlarm().send(
            notification({ lfgAlarmRingOnUp: true }),
            "up",
            { name: "Site" },
            { status: UP }
        );

        assert.strictEqual(result, "Sent Successfully.");
        assert.strictEqual(requests.length, 1);
    });

    test("send() explains a cooldown (HTTP 429)", async () => {
        status = 429;
        reply = { error: "cooling_down", message: "Rang moments ago", retryAfterSeconds: 42 };

        await assert.rejects(new LFGAlarm().send(notification(), "test"), {
            message: "The alarm rang moments ago; it can ring again in 42s.",
        });
    });

    test("send() explains a switched off alarm (HTTP 409)", async () => {
        status = 409;
        reply = { error: "alarm_off" };

        await assert.rejects(new LFGAlarm().send(notification(), "test"), {
            message: "This alarm is switched off in the LFG Alarm app.",
        });
    });

    test("send() explains an unknown link (HTTP 404)", async () => {
        status = 404;
        reply = { error: "not_found" };

        await assert.rejects(new LFGAlarm().send(notification(), "test"), { message: "No alarm at that link." });
    });

    test("send() rejects a link that is not https without calling it", async () => {
        await assert.rejects(new LFGAlarm().send(notification({ lfgAlarmUrl: `${baseUrl}/horn/abc` }), "test"), {
            message: /must start with https:\/\//,
        });
        assert.strictEqual(requests.length, 0);
    });
});
