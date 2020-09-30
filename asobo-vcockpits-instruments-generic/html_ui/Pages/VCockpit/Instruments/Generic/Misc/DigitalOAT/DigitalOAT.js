class DigitalOAT extends BaseInstrument {
    constructor() {
        super();
        this.isFarenheit = true;
    }
    get templateID() { return "DigitalOAT"; }
    connectedCallback() {
        super.connectedCallback();
        this.textElem = this.getChildById("textZone");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (_args[0] == "oclock_select") {
            this.isFarenheit = !this.isFarenheit;
        }
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                if (this.isFarenheit) {
                    this.textElem.textContent = this.getATMTemperatureF();
                }
                else {
                    this.textElem.textContent = this.getATMTemperatureC();
                }
            }
        }
    }
    getATMTemperatureC() {
        var value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        if (value) {
            var degrees = Number.parseInt(value);
            var temperature = degrees.toString() + "C";
            return temperature.toString();
        }
        return "";
    }
    getATMTemperatureF() {
        var value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "farenheit");
        if (value) {
            var degrees = Number.parseInt(value);
            var temperature = degrees.toString() + "F";
            return temperature.toString();
        }
        return "";
    }
}
registerInstrument("digital-oat-element", DigitalOAT);
//# sourceMappingURL=DigitalOAT.js.map