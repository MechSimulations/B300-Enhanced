class C300ADF extends BaseInstrument {
    constructor() {
        super();
        this.mode = 0;
    }
    get templateID() { return "C300ADF"; }
    connectedCallback() {
        super.connectedCallback();
        this.freqHundreds = this.getChildById("Hundreds");
        this.freqTens = this.getChildById("Tens");
        this.freqUnits = this.getChildById("Units");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (_args[0] == "adf_AntAdf") {
        }
        else if (_args[0] == "adf_bfo") {
        }
        else if (_args[0] == "adf_FltEt") {
        }
        else if (_args[0] == "adf_SetRst") {
        }
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                let activeFreq = this.getActiveFrequency();
                let units = activeFreq % 10;
                let tens = Math.floor((activeFreq % 100) / 10);
                let hundreds = Math.floor(activeFreq / 100);
                this.freqHundreds.textContent = hundreds.toString();
                this.freqTens.textContent = tens.toString();
                this.freqUnits.textContent = units.toString();
            }
            else {
                this.freqHundreds.textContent = "";
                this.freqTens.textContent = "";
                this.freqUnits.textContent = "";
            }
        }
    }
    getActiveFrequency() {
        return SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz");
    }
}
registerInstrument("c300adf-element", C300ADF);
//# sourceMappingURL=C300ADF.js.map