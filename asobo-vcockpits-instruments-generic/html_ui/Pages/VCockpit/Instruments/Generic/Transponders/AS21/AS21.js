class AS21 extends BaseInstrument {
    constructor() {
        super(...arguments);
        this.isIdent = false;
        this.editIndex = 0;
        this.isEditing = false;
        this.lastState = 0;
    }
    get templateID() { return "AS21"; }
    connectedCallback() {
        super.connectedCallback();
        this.elemReplyIndicator = this.getChildById("ReplyIndicator");
        this.elemCode = this.getChildById("Code");
        this.codeElements = [];
        this.code = [];
        for (let i = 1; i <= 4; i++) {
            this.code.push(-1);
            this.codeElements.push(this.getChildById("C" + i));
        }
        this.elemFlightId = this.getChildById("FlightId");
        this.elemActiveMode = this.getChildById("ActiveMode");
        this.elemReportedAltitude = this.getChildById("ReportedAltitude");
        this.elemIdent = this.getChildById("Ident");
        super.connectedCallback();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        let event;
        ;
        if (_args[0].startsWith("Transponder")) {
            event = _args[0].slice("Transponder".length);
        }
        switch (event) {
            case "_Code_INC":
                if (!this.isEditing) {
                    this.isEditing = true;
                    this.editIndex = 0;
                    this.codeElements[0].setAttribute("state", "Blink");
                    let code = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
                    for (let i = 0; i < this.code.length; i++) {
                        this.code[i] = parseInt(code.charAt(i));
                    }
                }
                else {
                    this.code[this.editIndex] = (this.code[this.editIndex] + 1) % 8;
                }
                break;
            case "_Code_DEC":
                if (!this.isEditing) {
                    this.isEditing = true;
                    this.editIndex = 0;
                    this.codeElements[0].setAttribute("state", "Blink");
                    let code = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
                    for (let i = 0; i < this.code.length; i++) {
                        this.code[i] = parseInt(code.charAt(i));
                    }
                }
                else {
                    this.code[this.editIndex] = (this.code[this.editIndex] - 1);
                    if (this.code[this.editIndex] < 0) {
                        this.code[this.editIndex] = 7;
                    }
                }
                break;
            case "ENTER":
                if (this.isEditing) {
                    this.codeElements[this.editIndex].setAttribute("state", "None");
                    this.editIndex++;
                    if (this.editIndex >= 4) {
                        this.sendNewCode();
                        this.isEditing = false;
                    }
                    else {
                        this.codeElements[this.editIndex].setAttribute("state", "Blink");
                    }
                }
                break;
            case "VFR":
                Simplane.setTransponderToRegion();
                let code = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
                for (let i = 0; i < this.code.length; i++) {
                    this.code[i] = parseInt(code.charAt(i));
                }
                this.isEditing = false;
                break;
            case "IDT":
                let state = this.getCurrentState();
                if (state > 2) {
                    this.elemIdent.setAttribute("state", "Ident");
                    this.isIdent = true;
                    this.identStartTime = Date.now();
                }
                break;
        }
    }
    Update() {
        super.Update();
        let state = this.getCurrentState();
        this.updateElectricity();
        if (this.isIdent && (state < 3 || Date.now() - this.identStartTime > 18000)) {
            this.isIdent = false;
            this.elemIdent.setAttribute("state", "None");
        }
        if (state != this.lastState) {
            switch (state) {
                case 1:
                    Avionics.Utils.diffAndSet(this.elemActiveMode, "SBY");
                    Avionics.Utils.diffAndSetAttribute(this.elemReplyIndicator, "state", "None");
                    break;
                case 3:
                    Avionics.Utils.diffAndSet(this.elemActiveMode, "ON");
                    Avionics.Utils.diffAndSetAttribute(this.elemReplyIndicator, "state", "Blink");
                    break;
                case 4:
                    Avionics.Utils.diffAndSet(this.elemActiveMode, "ALT");
                    Avionics.Utils.diffAndSetAttribute(this.elemReplyIndicator, "state", "Blink");
                    break;
                case 2:
                case 5:
                    Avionics.Utils.diffAndSet(this.elemActiveMode, "GND");
                    Avionics.Utils.diffAndSetAttribute(this.elemReplyIndicator, "state", "None");
                    break;
            }
            this.lastState = state;
        }
        if (this.isEditing) {
            for (let i = 0; i < this.codeElements.length; i++) {
                Avionics.Utils.diffAndSet(this.codeElements[i], this.code[i] == -1 ? "-" : this.code[i].toString());
            }
        }
        else {
            let code = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
            for (let i = 0; i < this.codeElements.length; i++) {
                Avionics.Utils.diffAndSet(this.codeElements[i], code.charAt(i));
            }
        }
        let alt = SimVar.GetSimVarValue("INDICATED ALTITUDE:3", "feet");
        Avionics.Utils.diffAndSet(this.elemReportedAltitude, "FL" + (alt < 0 ? "-" : "") + ("000" + fastToFixed((Math.abs(alt) / 100), 0)).slice(alt < 0 ? -2 : -3));
    }
    getCurrentState() {
        return SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
    }
    sendNewCode() {
        var code = this.code[0] * 4096 + this.code[1] * 256 + this.code[2] * 16 + this.code[3];
        SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
    }
    isElectricityAvailable() {
        if (SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == 0) {
            return false;
        }
        else {
            return super.isElectricityAvailable();
        }
    }
}
registerInstrument("as21-element", AS21);
//# sourceMappingURL=AS21.js.map