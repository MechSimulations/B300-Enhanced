class ASPropeller extends BaseInstrument {
    constructor() {
        super();
        this.arrowVisible = false;
        this.arrowTimeInState = 0;
        this.arrowLastRPM = 0;
    }
    get templateID() { return "ASPropeller"; }
    connectedCallback() {
        super.connectedCallback();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
    }
    Init() {
        super.Init();
        this.currentRPM = this.getChildById("#currentRPM");
        this.desiredRPM = this.getChildById("#desiredRPM");
        this.arrow = this.getChildById("#arrow");
        this.arrowLastRPM = Simplane.getEngineRPM(0);
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                let curRPM = Simplane.getEngineRPM(0);
                let targetRPM = SimVar.GetGameVarValue("AIRCRAFT_MAX_CRUISE_RPM", "rpm") * 0.85;
                if (this.currentRPM)
                    this.currentRPM.textContent = fastToFixed(curRPM, 0);
                if (this.desiredRPM)
                    this.desiredRPM.textContent = fastToFixed(targetRPM, 0);
                if (this.arrow)
                    this.updateArrow(curRPM);
            }
        }
    }
    updateArrow(_curRPM) {
        let visible = this.arrowVisible;
        if (_curRPM > this.arrowLastRPM) {
            if ((_curRPM - this.arrowLastRPM) >= 4) {
                visible = true;
                this.arrowLastRPM = _curRPM;
            }
        }
        else {
            this.arrowLastRPM = _curRPM;
            visible = false;
        }
        if (this.arrowVisible != visible && ((this.arrowVisible && this.arrowTimeInState >= 1.5) || (!this.arrowVisible && this.arrowTimeInState >= 0.5))) {
            this.arrowVisible = visible;
            this.arrowTimeInState = 0;
            if (this.arrowVisible)
                this.arrow.style.visibility = "visible";
            else
                this.arrow.style.visibility = "hidden";
        }
        else {
            this.arrowTimeInState += this.deltaTime / 1000;
        }
    }
}
registerInstrument("aspropeller-element", ASPropeller);
//# sourceMappingURL=ASPropeller.js.map