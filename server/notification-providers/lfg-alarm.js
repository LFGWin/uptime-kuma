const NotificationProvider = require("./notification-provider");
const axios = require("axios");
const { UP } = require("../../src/util");

class LFGAlarm extends NotificationProvider {
    name = "LFGAlarm";

    /**
     * @inheritdoc
     */
    async send(notification, msg, monitorJSON = null, heartbeatJSON = null) {
        const okMsg = "Sent Successfully.";

        // Rings for DOWN, certificate/domain expiry and the test button.
        // UP only rings when the user opted in.
        if (heartbeatJSON?.status === UP && !notification.lfgAlarmRingOnUp) {
            return "Not rung: ringing when a monitor is back up is turned off.";
        }

        const url = (notification.lfgAlarmUrl || "").trim();
        if (!url.startsWith("https://")) {
            throw new Error("The alarm link must start with https://");
        }

        try {
            // The phone shows the alarm's own name, so the request needs no body.
            const config = this.getAxiosConfigWithProxy({});
            await axios.post(url, null, config);
            return okMsg;
        } catch (error) {
            const status = error.response?.status;
            if (status === 429) {
                const seconds = error.response.data?.retryAfterSeconds;
                throw new Error(
                    seconds
                        ? `The alarm rang moments ago; it can ring again in ${seconds}s.`
                        : "The alarm rang moments ago; it can ring again shortly."
                );
            }
            if (status === 409) {
                throw new Error("This alarm is switched off in the LFG Alarm app.");
            }
            if (status === 404) {
                throw new Error("No alarm at that link.");
            }
            this.throwGeneralAxiosError(error);
        }
    }
}

module.exports = LFGAlarm;
