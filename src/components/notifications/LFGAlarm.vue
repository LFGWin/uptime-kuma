<template>
    <div class="mb-3">
        <label for="lfg-alarm-url" class="form-label">
            {{ $t("lfgAlarmUrl") }}
            <span style="color: red"><sup>*</sup></span>
        </label>
        <HiddenInput
            id="lfg-alarm-url"
            v-model="$parent.notification.lfgAlarmUrl"
            :required="true"
            autocomplete="new-password"
            placeholder="https://api.lfg.gm/horn/..."
        ></HiddenInput>
        <div class="form-text">{{ $t("lfgAlarmUrlHelptext") }}</div>
    </div>

    <div class="mb-3">
        <div class="form-check">
            <input
                id="lfg-alarm-ring-on-up"
                v-model="$parent.notification.lfgAlarmRingOnUp"
                class="form-check-input"
                type="checkbox"
            />
            <label class="form-check-label" for="lfg-alarm-ring-on-up">
                {{ $t("lfgAlarmRingOnUp") }}
            </label>
        </div>
        <div class="form-text">{{ $t("lfgAlarmRingOnUpHelptext") }}</div>
    </div>

    <div class="mb-3">
        <p class="form-text">{{ $t("lfgAlarmNameHelptext") }}</p>
        <i18n-t tag="p" keypath="lfgAlarmSetup" class="form-text">
            <a href="https://lfg.gm" target="_blank" rel="noopener">lfg.gm</a>
            <a href="https://lfg.gm/developers" target="_blank" rel="noopener">lfg.gm/developers</a>
        </i18n-t>
    </div>
</template>

<script>
import HiddenInput from "../HiddenInput.vue";

export default {
    components: {
        HiddenInput,
    },
};
</script>
