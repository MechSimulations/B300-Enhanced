var EMode;
(function (EMode) {
    EMode[EMode["LT"] = 0] = "LT";
    EMode[EMode["UTC"] = 1] = "UTC";
    EMode[EMode["FLIGHT"] = 2] = "FLIGHT";
    EMode[EMode["SW"] = 3] = "SW";
    EMode[EMode["DC"] = 4] = "DC";
})(EMode || (EMode = {}));
;
var EDownCounterEditMode;
(function (EDownCounterEditMode) {
    EDownCounterEditMode[EDownCounterEditMode["IDLE"] = 0] = "IDLE";
    EDownCounterEditMode[EDownCounterEditMode["HOURS"] = 1] = "HOURS";
    EDownCounterEditMode[EDownCounterEditMode["MINUTES"] = 2] = "MINUTES";
    EDownCounterEditMode[EDownCounterEditMode["SECONDS"] = 3] = "SECONDS";
})(EDownCounterEditMode || (EDownCounterEditMode = {}));
class LC2 extends BaseInstrument {
    constructor() {
        super();
        this.Modes = new Array();
        this.WantedModeId = 0;
        this.DisplayedModeId = -1;
        this.flightCurTime = -1;
        this.flightStartTime = -1;
        this.chronoStarted = false;
        this.chronoValue = 0;
        this.chronoLastTime = 0;
        this.downCounterStarted = false;
        this.downCounterValue = 0;
        this.downCounterLastTime = 0;
        this.downCounterEditMode = EDownCounterEditMode.IDLE;
    }
    get templateID() { return "LC2"; }
    connectedCallback() {
        super.connectedCallback();
        this.Hours = this.getChildById("Hours");
        this.Minutes = this.getChildById("Minutes");
        this.Seconds = this.getChildById("Seconds");
        this.Modes.push(this.getChildById("LT"));
        this.Modes.push(this.getChildById("UTC"));
        this.Modes.push(this.getChildById("Flight"));
        this.Modes.push(this.getChildById("SW"));
        this.Modes.push(this.getChildById("DC"));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (_args[0] == "oclock_mode") {
            this.WantedModeId++;
            if (this.WantedModeId >= this.Modes.length)
                this.WantedModeId = 0;
            this.setDownCounterEditMode(EDownCounterEditMode.IDLE);
        }
        else if (_args[0] == "oclock_set") {
            if (this.DisplayedModeId == EMode.DC) {
                if (this.downCounterEditMode == EDownCounterEditMode.IDLE)
                    this.setDownCounterEditMode(EDownCounterEditMode.HOURS);
                else if (this.downCounterEditMode == EDownCounterEditMode.HOURS)
                    this.setDownCounterEditMode(EDownCounterEditMode.MINUTES);
                else if (this.downCounterEditMode == EDownCounterEditMode.MINUTES)
                    this.setDownCounterEditMode(EDownCounterEditMode.SECONDS);
                else if (this.downCounterEditMode == EDownCounterEditMode.SECONDS)
                    this.setDownCounterEditMode(EDownCounterEditMode.IDLE);
            }
        }
        else if (_args[0] == "oclock_set_long") {
            if (this.DisplayedModeId == EMode.SW) {
                this.chronoValue = 0;
                this.chronoStarted = false;
            }
            else if (this.DisplayedModeId == EMode.DC) {
                this.downCounterValue = 0;
                this.setDownCounterEditMode(EDownCounterEditMode.HOURS);
            }
        }
        else if (_args[0] == "oclock_start") {
            if (this.DisplayedModeId == EMode.SW) {
                this.chronoStarted = !this.chronoStarted;
                if (this.chronoStarted)
                    this.chronoLastTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            }
            else if (this.DisplayedModeId == EMode.DC) {
                if (this.downCounterEditMode == EDownCounterEditMode.HOURS) {
                    this.downCounterValue += 3600;
                }
                else if (this.downCounterEditMode == EDownCounterEditMode.MINUTES) {
                    this.downCounterValue += 60;
                }
                else if (this.downCounterEditMode == EDownCounterEditMode.SECONDS) {
                    this.downCounterValue += 1;
                }
                else {
                    this.downCounterStarted = !this.downCounterStarted;
                    if (this.downCounterStarted)
                        this.downCounterLastTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                }
            }
        }
        else if (_args[0] == "oclock_start_long") {
        }
    }
    Update() {
        super.Update();
        var modeId = -1;
        if (this.flightStartTime <= 0) {
            this.flightStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            this.flightCurTime = this.flightStartTime;
        }
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                if (this.chronoStarted) {
                    var curTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                    if (curTime >= this.chronoLastTime) {
                        this.chronoValue += curTime - this.chronoLastTime;
                        this.chronoLastTime = curTime;
                    }
                }
                if (this.downCounterStarted) {
                    var curTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                    if (curTime >= this.downCounterLastTime) {
                        this.downCounterValue -= curTime - this.downCounterLastTime;
                        if (this.downCounterValue <= 0) {
                            this.downCounterValue = 0;
                            this.downCounterStarted = false;
                        }
                        this.downCounterLastTime = curTime;
                    }
                }
                modeId = this.WantedModeId;
                this.updateDisplay(modeId);
            }
        }
        if (modeId != this.DisplayedModeId) {
            for (var i = 0; i < this.Modes.length; i++) {
                if (i == modeId) {
                    this.Modes[i].setAttribute("state", "on");
                }
                else {
                    this.Modes[i].setAttribute("state", "off");
                }
            }
            this.DisplayedModeId = modeId;
        }
    }
    updateDisplay(_mode) {
        switch (_mode) {
            case EMode.LT:
                {
                    var simValue = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
                    if (simValue) {
                        var totalSeconds = Number.parseInt(simValue);
                        this.setTime(totalSeconds);
                    }
                    break;
                }
            case EMode.UTC:
                {
                    var simValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                    if (simValue) {
                        var totalSeconds = Number.parseInt(simValue);
                        this.setTime(totalSeconds);
                    }
                    break;
                }
            case EMode.FLIGHT:
                {
                    var time = this.getFlightTime();
                    this.setTime(time);
                    break;
                }
            case EMode.SW:
                {
                    this.setTime(this.chronoValue);
                    break;
                }
            case EMode.DC:
                {
                    this.setTime(this.downCounterValue);
                    if (this.downCounterEditMode == EDownCounterEditMode.HOURS) {
                        if (this.frameCount % 10 == 0)
                            this.Hours.style.visibility = (this.Hours.style.visibility == "visible") ? "hidden" : "visible";
                    }
                    else if (this.downCounterEditMode == EDownCounterEditMode.MINUTES) {
                        if (this.frameCount % 10 == 0)
                            this.Minutes.style.visibility = (this.Minutes.style.visibility == "visible") ? "hidden" : "visible";
                    }
                    else if (this.downCounterEditMode == EDownCounterEditMode.SECONDS) {
                        if (this.frameCount % 10 == 0)
                            this.Seconds.style.visibility = (this.Seconds.style.visibility == "visible") ? "hidden" : "visible";
                    }
                    break;
                }
        }
    }
    setDownCounterEditMode(_mode) {
        this.downCounterEditMode = _mode;
        this.Hours.style.visibility = "visible";
        this.Minutes.style.visibility = "visible";
        this.Seconds.style.visibility = "visible";
    }
    setTime(totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
        var seconds = Math.floor(totalSeconds - (minutes * 60) - (hours * 3600));
        this.Hours.textContent = hours.toString();
        this.Minutes.textContent = "";
        if (minutes < 10)
            this.Minutes.textContent = "0";
        this.Minutes.textContent += minutes;
        this.Seconds.textContent = "";
        if (seconds < 10)
            this.Seconds.textContent = "0";
        this.Seconds.textContent += seconds;
    }
    getFlightTime() {
        var value = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        if (value >= this.flightStartTime) {
            this.flightCurTime = value - this.flightStartTime;
        }
        return this.flightCurTime;
    }
}
registerInstrument("lc2-element", LC2);
//# sourceMappingURL=LC2.js.map