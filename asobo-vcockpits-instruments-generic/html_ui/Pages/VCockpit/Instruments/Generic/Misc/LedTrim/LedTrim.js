class LedTrim extends BaseInstrument {
    constructor() {
        super();
        this.trimId = -1;
    }
    get templateID() { return "LedTrim"; }
    connectedCallback() {
        super.connectedCallback();
        this.allRects = this.querySelectorAll(".rect");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
    }
    Update() {
        super.Update();
        var trimId = -1;
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                var trimPercent = (Simplane.getTrim() + 1.0) * 0.5;
                trimId = Math.round(trimPercent * 9);
            }
        }
        if (trimId != this.trimId) {
            for (var i = 0; i < this.allRects.length; i++) {
                if (trimId == i)
                    this.allRects[i].setAttribute("state", "on");
                else
                    this.allRects[i].setAttribute("state", "off");
            }
            this.trimId = trimId;
        }
    }
}
registerInstrument("led-trim-element", LedTrim);
//# sourceMappingURL=LedTrim.js.map