class PI463 extends BaseInstrument {
    constructor() {
        super();
    }
    get templateID() { return "PI463"; }
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
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
            }
        }
    }
}
registerInstrument("pi463-element", PI463);
//# sourceMappingURL=PI463.js.map