class M803 extends BaseInstrument {
    constructor() {
        super();
        this.topSelectorMode = 0;
        this.chronoStarted = false;
        this.chronoValue = 0;
        this.chronoLastTime = 0;
        this.bottomSelectorMode = 0;
        this.flightStartTime = -1;
    }
    get templateID() { return "M803"; }
    connectedCallback() {
        super.connectedCallback();
        this.topSelectorElem = this.getChildById("TopSelectorValue");
        this.bottomSelectorModeElem = this.getChildById("BottomSelectorMode");
        this.bottomselectorValueElem = this.getChildById("BottomSelectorValue");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (_args[0] == "oclock_select") {
            this.bottomSelectorMode++;
            if (this.bottomSelectorMode > 3)
                this.bottomSelectorMode = 0;
        }
        else if (_args[0] == "oclock_control") {
            if (this.bottomSelectorMode == 3) {
                if (this.chronoStarted) {
                    this.chronoStarted = false;
                }
                else if (this.chronoValue > 0) {
                    this.chronoValue = 0;
                }
                else {
                    this.chronoStarted = true;
                    this.chronoLastTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                }
            }
        }
        else if (_args[0] == "oclock_control_long") {
            if (this.bottomSelectorMode == 2) {
                this.flightStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            }
        }
        else if (_args[0] == "oclock_oat") {
            this.topSelectorMode++;
            if (this.topSelectorMode > 2)
                this.topSelectorMode = 0;
        }
        else if (_args[0] == "oclock_countdown") {
        }
    }
    Update() {
        super.Update();
        if (this.flightStartTime <= 0) {
            this.flightStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        }
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                if (this.chronoStarted) {
                    var curTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                    this.chronoValue += curTime - this.chronoLastTime;
                    this.chronoLastTime = curTime;
                }
                if (this.topSelectorElem) {
                    if (this.topSelectorMode == 0)
                        this.topSelectorElem.textContent = this.getVoltage();
                    else if (this.topSelectorMode == 1)
                        this.topSelectorElem.textContent = this.getATMTemperatureF();
                    else if (this.topSelectorMode == 2)
                        this.topSelectorElem.textContent = this.getATMTemperatureC();
                }
                if (this.bottomSelectorModeElem) {
                    if (this.bottomSelectorMode == 0)
                        this.bottomSelectorModeElem.setAttribute("state", "UT");
                    else if (this.bottomSelectorMode == 1)
                        this.bottomSelectorModeElem.setAttribute("state", "LT");
                    else if (this.bottomSelectorMode == 2)
                        this.bottomSelectorModeElem.setAttribute("state", "FT");
                    else if (this.bottomSelectorMode == 3)
                        this.bottomSelectorModeElem.setAttribute("state", "ET");
                }
                if (this.bottomselectorValueElem) {
                    if (this.bottomSelectorMode == 0)
                        this.bottomselectorValueElem.textContent = this.getUTCTime();
                    else if (this.bottomSelectorMode == 1)
                        this.bottomselectorValueElem.textContent = this.getLocalTime();
                    else if (this.bottomSelectorMode == 2)
                        this.bottomselectorValueElem.textContent = this.getFlightTime();
                    else if (this.bottomSelectorMode == 3)
                        this.bottomselectorValueElem.textContent = this.getChronoTime();
                }
            }
        }
    }
    getATMTemperatureF() {
        var value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "farenheit");
        if (value) {
            var degrees = Number.parseInt(value);
            var temperature = degrees.toString() + "°F";
            return temperature.toString();
        }
        return "";
    }
    getATMTemperatureC() {
        var value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        if (value) {
            var degrees = Number.parseInt(value);
            var temperature = degrees.toString() + "°C";
            return temperature.toString();
        }
        return "";
    }
    getVoltage() {
        var value = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts");
        if (value) {
            var degrees = Number.parseInt(value);
            var temperature = degrees.toString() + "V";
            return temperature.toString();
        }
        return "";
    }
    getUTCTime() {
        var value = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        if (value) {
            var seconds = Number.parseInt(value);
            var time = Utils.SecondsToDisplayTime(seconds, true, false, false);
            return time.toString();
        }
        return "";
    }
    getLocalTime() {
        var value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        if (value) {
            var seconds = Number.parseInt(value);
            var time = Utils.SecondsToDisplayTime(seconds, true, false, false);
            return time.toString();
        }
        return "";
    }
    getFlightTime() {
        var currtime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        var value;
        if (currtime < this.flightStartTime) {
            value = 0;
            this.flightStartTime = currtime;
        }
        else {
            value = currtime - this.flightStartTime;
        }
        if (value) {
            var time = Utils.SecondsToDisplayTime(value, true, false, false);
            return time.toString();
        }
        return "";
    }
    getChronoTime() {
        var totalSeconds = this.chronoValue;
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
        var seconds = Math.floor(totalSeconds - (minutes * 60) - (hours * 3600));
        var time = "";
        if (hours == 0) {
            if (minutes < 10)
                time += "0";
            time += minutes;
            time += ":";
            if (seconds < 10)
                time += "0";
            time += seconds;
        }
        else {
            if (hours < 10)
                time += "0";
            time += hours;
            time += ":";
            if (minutes < 10)
                time += "0";
            time += minutes;
        }
        return time.toString();
    }
}
registerInstrument("m803-element", M803);
//# sourceMappingURL=M803.js.map