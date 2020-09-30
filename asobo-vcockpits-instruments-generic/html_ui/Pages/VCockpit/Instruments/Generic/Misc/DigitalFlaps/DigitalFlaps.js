class DigitalFlaps extends BaseInstrument {
    constructor() {
        super();
    }
    get templateID() { return "DigitalFlaps"; }
    connectedCallback() {
        super.connectedCallback();
        this.textElem = this.getChildById("textZone");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                this.textElem.textContent = this.getFlapsAngle();
            }
        }
    }
    getFlapsAngle() {
        var value = Math.round(Simplane.getFlapsAngle() * 180 / Math.PI);
        return value.toString();
    }
}
registerInstrument("digital-flaps-element", DigitalFlaps);
//# sourceMappingURL=DigitalFlaps.js.map