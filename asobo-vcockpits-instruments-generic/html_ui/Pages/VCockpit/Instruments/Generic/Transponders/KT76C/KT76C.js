class KT76C extends BaseInstrument {
    constructor() {
        super();
        this.editTime = 0;
        this.newCode = [-1, -1, -1, -1];
        this.currEdit = 0;
        this.blinkCounter = 0;
        this.timeIdt = 0;
    }
    get templateID() { return "KT76C"; }
    connectedCallback() {
        super.connectedCallback();
        this.FL = this.getChildById("FL");
        this.AltDisplay = this.getChildById("AltitudeDisplay");
        this.ModeAnnunc = this.getChildById("ModeAnnunc");
        this.R = this.getChildById("R");
        this.CodeDisplay = this.getChildById("CodeDisplay");
        this.minus = this.getChildById("minus");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (_args[0] == "TransponderIDT") {
            this.timeIdt = 18000;
        }
        else if (_args[0] == "TransponderVFR") {
            this.editTime = 0;
            Simplane.setTransponderToRegion();
            this.CodeDisplay.textContent = this.getCode();
        }
        else if (_args[0] == "TransponderCLR") {
            if (this.editTime > 0) {
                if (this.currEdit > 0) {
                    this.currEdit--;
                    this.newCode[this.currEdit] = -1;
                }
                this.editTime = 4000;
            }
            else {
                Simplane.setTransponderToZero();
                this.CodeDisplay.textContent = this.getCode();
            }
        }
        else if (_args[0] == "Transponder0") {
            this.digitEvent(0);
        }
        else if (_args[0] == "Transponder1") {
            this.digitEvent(1);
        }
        else if (_args[0] == "Transponder2") {
            this.digitEvent(2);
        }
        else if (_args[0] == "Transponder3") {
            this.digitEvent(3);
        }
        else if (_args[0] == "Transponder4") {
            this.digitEvent(4);
        }
        else if (_args[0] == "Transponder5") {
            this.digitEvent(5);
        }
        else if (_args[0] == "Transponder6") {
            this.digitEvent(6);
        }
        else if (_args[0] == "Transponder7") {
            this.digitEvent(7);
        }
        else if (_args[0] == "TransponderOFF") {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 0);
        }
        else if (_args[0] == "TransponderSTBY") {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
        }
        else if (_args[0] == "TransponderTST") {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 2);
        }
        else if (_args[0] == "TransponderON") {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 3);
        }
        else if (_args[0] == "TransponderALT") {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 4);
        }
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                if (this.editTime > 0) {
                    this.editTime -= this.deltaTime;
                }
                var state = this.getCurrentState();
                if (state) {
                    switch (state) {
                        case 1:
                            this.ModeAnnunc.setAttribute("state", "SBY");
                            this.R.style.visibility = "hidden";
                            this.FL.style.visibility = "hidden";
                            this.minus.style.visibility = "hidden";
                            this.AltDisplay.textContent = "";
                            this.CodeDisplay.textContent = this.getCode();
                            break;
                        case 2:
                            this.ModeAnnunc.setAttribute("state", "TST");
                            this.R.style.visibility = "visible";
                            this.FL.style.visibility = "visible";
                            this.minus.style.visibility = "visible";
                            this.AltDisplay.textContent = "888";
                            this.CodeDisplay.textContent = "8888";
                            break;
                        case 3:
                            this.ModeAnnunc.setAttribute("state", "ON");
                            this.FL.style.visibility = "hidden";
                            this.minus.style.visibility = "hidden";
                            this.AltDisplay.textContent = "";
                            break;
                        case 4:
                            this.ModeAnnunc.setAttribute("state", "ALT");
                            this.FL.style.visibility = "visible";
                            var alt = this.getAltitude();
                            this.AltDisplay.textContent = ("000" + fastToFixed((Math.abs(alt) / 100), 0)).slice(-3);
                            if (alt < 0) {
                                this.minus.style.visibility = "visible";
                            }
                            else {
                                this.minus.style.visibility = "hidden";
                            }
                            break;
                    }
                    if (state == 3 || state == 4) {
                        this.CodeDisplay.textContent = this.getCode();
                        if (this.timeIdt > 0) {
                            this.timeIdt -= this.deltaTime;
                            this.R.style.visibility = "visible";
                        }
                        else {
                            if (this.blinkGetState(1000, 200)) {
                                this.R.style.visibility = "visible";
                            }
                            else {
                                this.R.style.visibility = "hidden";
                            }
                        }
                    }
                }
                else {
                    this.AltDisplay.textContent = "";
                    this.CodeDisplay.textContent = "";
                    this.ModeAnnunc.setAttribute("state", "none");
                    this.R.style.visibility = "hidden";
                    this.FL.style.visibility = "hidden";
                    this.minus.style.visibility = "hidden";
                }
            }
        }
    }
    blinkGetState(_blinkPeriod, _duration) {
        return Math.round(Date.now() / _duration) % (_blinkPeriod / _duration) == 0;
    }
    getAltitude() {
        return SimVar.GetSimVarValue("INDICATED ALTITUDE:3", "feet");
    }
    getCode() {
        if (this.editTime > 0) {
            var displayCode = "";
            for (var i = 0; i < 4; i++) {
                if (this.newCode[i] == -1) {
                    displayCode += "-";
                }
                else {
                    displayCode += this.newCode[i];
                    displayCode += "";
                }
            }
            return displayCode;
        }
        else {
            return ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
        }
    }
    getCurrentState() {
        return SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
    }
    digitEvent(_number) {
        if (this.editTime <= 0) {
            this.newCode[0] = _number;
            this.newCode[1] = -1;
            this.newCode[2] = -1;
            this.newCode[3] = -1;
            this.currEdit = 1;
            this.editTime = 4000;
        }
        else {
            this.editTime = 4000;
            this.newCode[this.currEdit] = _number;
            this.currEdit++;
            if (this.currEdit == 4) {
                this.editTime = 0;
                this.sendNewCode();
            }
        }
    }
    sendNewCode() {
        var code = this.newCode[0] * 4096 + this.newCode[1] * 256 + this.newCode[2] * 16 + this.newCode[3];
        SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
    }
}
registerInstrument("kt76c-element", KT76C);
//# sourceMappingURL=KT76C.js.map