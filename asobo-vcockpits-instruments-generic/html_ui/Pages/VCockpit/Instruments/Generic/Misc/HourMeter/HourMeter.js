class HourMeter extends BaseInstrument {
    constructor() {
        super();
    }
    get templateID() { return "HourMeter"; }
    connectedCallback() {
        super.connectedCallback();
        this.digits = [];
        this.digitsBot = [];
        for (let i = 1; i <= 6; i++) {
            this.digits.push(this.getChildById("d" + i));
            this.digitsBot.push(this.getChildById("d" + i + "Bot"));
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Update() {
        super.Update();
        let hour = SimVar.GetSimVarValue("GENERAL ENG ELAPSED TIME:1", "hour");
        for (let i = this.digits.length - 1; i >= 0; i--) {
            if (hour < 0) {
                hour = 0;
            }
            let power = this.digits.length - i - 2;
            let digit = Math.floor((hour % Math.pow(10, power + 1)) / Math.pow(10, power));
            if (this.digits[i].textContent != digit.toString()) {
                this.digits[i].textContent = digit.toString();
                this.digitsBot[i].textContent = ((digit + 1) % 10).toString();
            }
            if (Math.pow(10, power) * (digit + 1) < (hour % Math.pow(10, power + 1)) + 0.001) {
                this.digits[i].style.transform = "translate(0vh,-" + ((100000 * hour) % 100).toString() + "vh)";
                this.digitsBot[i].style.transform = "translate(0vh,-" + ((100000 * hour) % 100).toString() + "vh)";
            }
            else {
                this.digits[i].style.transform = "";
                this.digitsBot[i].style.transform = "";
            }
            hour -= 0.0001;
        }
    }
}
registerInstrument("hour-meter-element", HourMeter);
//# sourceMappingURL=HourMeter.js.map