class AS92 extends BaseInstrument {
    constructor() {
        super();
        this.radioIndex = 1;
    }
    get templateID() { return "AS92"; }
    connectedCallback() {
        super.connectedCallback();
        this.comActiveFreq = this.getChildById("PrimaryFrequency");
        this.comStandbyFreq = this.getChildById("StandbyFrequency");
        var parsedUrl = new URL(this.getAttribute("Url"));
        this.radioIndex = parseInt(parsedUrl.searchParams.get("Index"));
        if (!this.radioIndex) {
            this.radioIndex = 1;
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Init() {
        super.Init();
        SimVar.SetSimVarValue("K:COM_" + this.radioIndex + "_SPACING_MODE_SWITCH", "number", 1);
    }
    onInteractionEvent(_args) {
        super.onInteractionEvent(_args);
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                Avionics.Utils.diffAndSet(this.comActiveFreq, this.getActiveComFreq());
                Avionics.Utils.diffAndSet(this.comStandbyFreq, this.getStandbyComFreq());
            }
        }
    }
    getActiveComFreq() {
        return SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:" + this.radioIndex, "MHz").toFixed(3);
    }
    getStandbyComFreq() {
        return SimVar.GetSimVarValue("COM STANDBY FREQUENCY:" + this.radioIndex, "MHz").toFixed(3);
    }
}
registerInstrument("as92-element", AS92);
//# sourceMappingURL=AS92.js.map