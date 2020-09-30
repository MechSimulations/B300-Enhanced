class ASVigilus extends BaseInstrument {
    constructor() {
        super();
        this.gauges = [];
        this.isOn = false;
        this.initTime = 5000;
        this.startInit = 0;
    }
    get templateID() { return "ASVigilus"; }
    connectedCallback() {
        super.connectedCallback();
        this.titleElem = this.getChildById("title");
        this.settings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
        this.fuelGauge = new Vigilus_FuelQuantity(this, "FuelLeft", "FuelRight", this.settings.FuelQuantity, this.settings.FuelQuantity);
        this.gauges.push(new Vigilus_RPM(this, this.settings.RPM));
        this.gauges.push(new Vigilus_MAP(this, this.settings.ManifoldPressure));
        this.gauges.push(new Vigilus_Oil(this, "OilPress", "OilTemp", this.settings.OilPressure, this.settings.OilTemperature));
        this.gauges.push(this.fuelGauge);
        this.gauges.push(new Vigilus_OAT(this));
        this.gauges.push(new Vigilus_FuelPress(this, this.settings.FuelPressure));
        this.gauges.push(new Vigilus_FlightTime(this));
        this.gauges.push(new Vigilus_Volts(this, this.settings.MainBusVoltage));
        this.gauges.push(new Vigilus_Amps(this, this.settings.BatteryBusAmps));
        this.gauges.push(new Vigilus_EGT(this));
        this.gauges.push(new Vigilus_CHT(this));
        for (let i = 0; i < this.gauges.length; i++) {
            this.gauges[i].init();
        }
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let leftFuelName = this.instrumentXmlConfig.getElementsByTagName("LeftFuelName");
            if (leftFuelName.length > 0) {
                this.getChildById("FuelNameLeft").textContent = leftFuelName[0].textContent;
            }
            let leftFuelSimvar = this.instrumentXmlConfig.getElementsByTagName("LeftFuelQuantity");
            if (leftFuelName.length > 0) {
                this.fuelGauge.leftQty = new CompositeLogicXMLElement(this, leftFuelSimvar[0]);
            }
            let leftFuelCapacity = this.instrumentXmlConfig.getElementsByTagName("LeftFuelCapacity");
            if (leftFuelName.length > 0) {
                this.fuelGauge.leftCapacity = new CompositeLogicXMLElement(this, leftFuelCapacity[0]);
            }
            let rightFuelName = this.instrumentXmlConfig.getElementsByTagName("RightFuelName");
            if (rightFuelName.length > 0) {
                this.getChildById("FuelNameRight").textContent = rightFuelName[0].textContent;
            }
            let rightFuelSimvar = this.instrumentXmlConfig.getElementsByTagName("RightFuelQuantity");
            if (rightFuelName.length > 0) {
                this.fuelGauge.rightQty = new CompositeLogicXMLElement(this, rightFuelSimvar[0]);
            }
            let rightFuelCapacity = this.instrumentXmlConfig.getElementsByTagName("RightFuelCapacity");
            if (rightFuelName.length > 0) {
                this.fuelGauge.rightCapacity = new CompositeLogicXMLElement(this, rightFuelCapacity[0]);
            }
        }
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
                if (!this.isOn) {
                    this.startInit = Date.now();
                }
                if (Date.now() - this.startInit < this.initTime) {
                    Avionics.Utils.diffAndSetAttribute(this.electricity, "state", "init");
                }
                else {
                    Avionics.Utils.diffAndSetAttribute(this.electricity, "state", "on");
                }
                for (let i = 0; i < this.gauges.length; i++) {
                    this.gauges[i].update();
                }
                this.isOn = true;
            }
            else if (this.isOn) {
                this.electricity.setAttribute("state", "off");
                for (let i = 0; i < this.gauges.length; i++) {
                    this.gauges[i].onShutDown();
                }
                this.isOn = false;
            }
        }
    }
}
class Vigilus_Gauge {
    constructor(_instrument) {
        this.instrument = _instrument;
    }
    onShutDown() {
    }
}
class Vigilus_RPM extends Vigilus_Gauge {
    constructor(_instrument, _config) {
        super(_instrument);
        this.minAngle = 0;
        this.maxAngle = 3.49;
        this.minValue = 0;
        this.maxValue = 0;
        this.greenStart = 0;
        this.greenEnd = 0;
        this.yellowStart = 0;
        this.yellowEnd = 0;
        this.redStart = 0;
        this.redEnd = 0;
        this.minValue = _config.min;
        this.maxValue = _config.max;
        this.greenStart = _config.greenStart;
        this.greenEnd = _config.greenEnd;
        this.yellowStart = _config.yellowStart;
        this.yellowEnd = _config.yellowEnd;
        this.redStart = _config.redStart;
        this.redEnd = _config.redEnd;
    }
    init() {
        this.text = this.instrument.getChildById("RPM_Value");
        this.text_outline = this.instrument.getChildById("RPM_Value_Outline");
        this.cursor = this.instrument.getChildById("RPM_Cursor");
        this.cursor_path = this.instrument.getChildById("RPM_CursorPath");
        this.greenArc = this.instrument.getChildById("RPM_Green");
        this.yellowArc = this.instrument.getChildById("RPM_Yellow");
        this.redArc = this.instrument.getChildById("RPM_Red");
        let greenBeginAngle = this.valueToAngle(this.greenStart);
        let greenEndAngle = this.valueToAngle(this.greenEnd);
        let greenBeginSin = Math.sin(greenBeginAngle);
        let greenBeginCos = Math.cos(greenBeginAngle);
        let greenEndSin = Math.sin(greenEndAngle);
        let greenEndCos = Math.cos(greenEndAngle);
        let greenBigFlag = ((greenEndAngle - greenBeginAngle) <= Math.PI) ? "0" : "1";
        this.greenArc.setAttribute("d", "M" + (50 + (greenBeginCos * 35)) + " " + (30 + (greenBeginSin * 35)) + " A35 35 0 " + greenBigFlag + " 1 " + (50 + (greenEndCos * 35)) + " " + (30 + (greenEndSin * 35)) + " L" + (50 + (greenEndCos * 40)) + " " + (30 + (greenEndSin * 40)) + "  A40 40 0 " + greenBigFlag + " 0 " + (50 + (greenBeginCos * 40)) + " " + (30 + (greenBeginSin * 40)) + " Z");
        let yellowBeginAngle = this.valueToAngle(this.yellowStart);
        let yellowEndAngle = this.valueToAngle(this.yellowEnd);
        let yellowBeginSin = Math.sin(yellowBeginAngle);
        let yellowBeginCos = Math.cos(yellowBeginAngle);
        let yellowEndSin = Math.sin(yellowEndAngle);
        let yellowEndCos = Math.cos(yellowEndAngle);
        let yellowBigFlag = ((yellowEndAngle - yellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.yellowArc.setAttribute("d", "M" + (50 + (yellowBeginCos * 35)) + " " + (30 + (yellowBeginSin * 35)) + " A35 35 0 " + yellowBigFlag + " 1 " + (50 + (yellowEndCos * 35)) + " " + (30 + (yellowEndSin * 35)) + " L" + (50 + (yellowEndCos * 40)) + " " + (30 + (yellowEndSin * 40)) + "  A40 40 0 " + yellowBigFlag + " 0 " + (50 + (yellowBeginCos * 40)) + " " + (30 + (yellowBeginSin * 40)) + " Z");
        let redBeginAngle = this.valueToAngle(this.redStart);
        let redEndAngle = this.valueToAngle(this.redEnd);
        let redBeginSin = Math.sin(redBeginAngle);
        let redBeginCos = Math.cos(redBeginAngle);
        let redEndSin = Math.sin(redEndAngle);
        let redEndCos = Math.cos(redEndAngle);
        let redBigFlag = ((redEndAngle - redBeginAngle) <= Math.PI) ? "0" : "1";
        this.redArc.setAttribute("d", "M" + (50 + (redBeginCos * 35)) + " " + (30 + (redBeginSin * 35)) + " A35 35 0 " + redBigFlag + " 1 " + (50 + (redEndCos * 35)) + " " + (30 + (redEndSin * 35)) + " L" + (50 + (redEndCos * 40)) + " " + (30 + (redEndSin * 40)) + "  A40 40 0 " + redBigFlag + " 0 " + (50 + (redBeginCos * 40)) + " " + (30 + (redBeginSin * 40)) + " Z");
    }
    update() {
        let rpm = SimVar.GetSimVarValue("GENERAL ENG RPM:1", "Rpm");
        this.text.textContent = fastToFixed(rpm, 0);
        this.cursor.setAttribute("transform", "rotate(" + (this.valueToAngle(rpm) / Math.PI * 180) + ",50,30)");
        let cursorPathEndAngle = this.valueToAngle(rpm);
        let cursorPathEndSin = Math.sin(cursorPathEndAngle);
        let cursorPathEndCos = Math.cos(cursorPathEndAngle);
        let cursorPathBigFlag = (cursorPathEndAngle <= Math.PI) ? "0" : "1";
        this.cursor_path.setAttribute("d", "M50 30 L85 30 A35 35 0 " + cursorPathBigFlag + " 1 " + (50 + (cursorPathEndCos * 35)) + " " + (30 + (cursorPathEndSin * 35)) + " Z");
        if (rpm < this.redEnd && rpm >= this.redStart) {
            this.text_outline.setAttribute("stroke", "red");
        }
        else if (rpm < this.yellowEnd && rpm >= this.yellowStart) {
            this.text_outline.setAttribute("stroke", "yellow");
        }
        else if (rpm < this.greenEnd && rpm >= this.greenStart) {
            this.text_outline.setAttribute("stroke", "green");
        }
        else {
            this.text_outline.setAttribute("stroke", "white");
        }
    }
    valueToAngle(_value) {
        if ((this.maxValue - this.minValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
}
class Vigilus_MAP extends Vigilus_Gauge {
    constructor(_instrument, _config) {
        super(_instrument);
        this.minAngle = 0;
        this.maxAngle = 3.49;
        this.minValue = 0;
        this.maxValue = 0;
        this.greenStart = 0;
        this.greenEnd = 0;
        this.minValue = _config.min;
        this.maxValue = _config.max;
        this.greenStart = _config.greenStart;
        this.greenEnd = _config.greenEnd;
    }
    init() {
        this.text = this.instrument.getChildById("MAP_Value");
        this.text_outline = this.instrument.getChildById("MAP_Value_Outline");
        this.cursor = this.instrument.getChildById("MAP_Cursor");
        this.cursor_path = this.instrument.getChildById("MAP_CursorPath");
        this.greenArc = this.instrument.getChildById("MAP_Green");
        let greenBeginAngle = this.valueToAngle(this.greenStart);
        let greenEndAngle = this.valueToAngle(this.greenEnd);
        let greenBeginSin = Math.sin(greenBeginAngle);
        let greenBeginCos = Math.cos(greenBeginAngle);
        let greenEndSin = Math.sin(greenEndAngle);
        let greenEndCos = Math.cos(greenEndAngle);
        let greenBigFlag = ((greenEndAngle - greenBeginAngle) <= 180) ? "0" : "1";
        this.greenArc.setAttribute("d", "M" + (50 + (greenBeginCos * 35)) + " " + (30 + (greenBeginSin * 35)) + " A35 35 0 " + greenBigFlag + " 1 " + (50 + (greenEndCos * 35)) + " " + (30 + (greenEndSin * 35)) + " L" + (50 + (greenEndCos * 40)) + " " + (30 + (greenEndSin * 40)) + "  A40 40 0 " + greenBigFlag + " 0 " + (50 + (greenBeginCos * 40)) + " " + (30 + (greenBeginSin * 40)) + " Z");
    }
    update() {
        let MAP = SimVar.GetSimVarValue("ENG MANIFOLD PRESSURE:1", "inHG");
        this.text.textContent = MAP.toFixed(1);
        this.cursor.setAttribute("transform", "rotate(" + (this.valueToAngle(MAP) / Math.PI * 180) + ",50,30)");
        let cursorPathEndAngle = this.valueToAngle(MAP);
        let cursorPathEndSin = Math.sin(cursorPathEndAngle);
        let cursorPathEndCos = Math.cos(cursorPathEndAngle);
        let cursorPathBigFlag = (cursorPathEndAngle <= Math.PI) ? "0" : "1";
        this.cursor_path.setAttribute("d", "M50 30 L85 30 A35 35 0 " + cursorPathBigFlag + " 1 " + (50 + (cursorPathEndCos * 35)) + " " + (30 + (cursorPathEndSin * 35)) + " Z");
        if (MAP < this.greenEnd && MAP >= this.greenStart) {
            this.text_outline.setAttribute("stroke", "green");
        }
        else {
            this.text_outline.setAttribute("stroke", "white");
        }
    }
    valueToAngle(_value) {
        if ((this.maxValue - this.minValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
}
class Vigilus_DoubleCircle extends Vigilus_Gauge {
    constructor(_instrument, _prefixLeft, _prefixRight, _configLeft, _configRight) {
        super(_instrument);
        this.minAngle = -0.698132;
        this.maxAngle = 1.48353;
        this.leftMinValue = 0;
        this.leftMaxValue = 0;
        this.leftGreenStart = 0;
        this.leftGreenEnd = 0;
        this.leftYellowStart = 0;
        this.leftYellowEnd = 0;
        this.leftRedStart = 0;
        this.leftRedEnd = 0;
        this.leftLowYellowStart = 0;
        this.leftLowYellowEnd = 0;
        this.leftLowRedStart = 0;
        this.leftLowRedEnd = 0;
        this.rightMinValue = 0;
        this.rightMaxValue = 0;
        this.rightGreenStart = 0;
        this.rightGreenEnd = 0;
        this.rightYellowStart = 0;
        this.rightYellowEnd = 0;
        this.rightRedStart = 0;
        this.rightRedEnd = 0;
        this.rightLowYellowStart = 0;
        this.rightLowYellowEnd = 0;
        this.rightLowRedStart = 0;
        this.rightLowRedEnd = 0;
        this.leftMinValue = _configLeft.min;
        this.leftMaxValue = _configLeft.max;
        if (_configLeft.__Type == "ColorRangeDisplay" || _configLeft.__Type == "ColorRangeDisplay2" || _configLeft.__Type == "ColorRangeDisplay3") {
            this.leftGreenStart = _configLeft.greenStart;
            this.leftGreenEnd = _configLeft.greenEnd;
            if (_configLeft.__Type == "ColorRangeDisplay2" || _configLeft.__Type == "ColorRangeDisplay3") {
                this.leftYellowStart = _configLeft.yellowStart;
                this.leftYellowEnd = _configLeft.yellowEnd;
                this.leftRedStart = _configLeft.redStart;
                this.leftRedEnd = _configLeft.redEnd;
                if (_configLeft.__Type == "ColorRangeDisplay3") {
                    this.leftLowYellowStart = _configLeft.lowYellowStart;
                    this.leftLowYellowEnd = _configLeft.lowYellowEnd;
                    this.leftLowRedStart = _configLeft.lowRedStart;
                    this.leftLowRedEnd = _configLeft.lowRedEnd;
                }
            }
        }
        this.rightMinValue = _configRight.min;
        this.rightMaxValue = _configRight.max;
        if (_configRight.__Type == "ColorRangeDisplay" || _configRight.__Type == "ColorRangeDisplay2" || _configRight.__Type == "ColorRangeDisplay3") {
            this.rightGreenStart = _configRight.greenStart;
            this.rightGreenEnd = _configRight.greenEnd;
            if (_configRight.__Type == "ColorRangeDisplay2" || _configRight.__Type == "ColorRangeDisplay3") {
                this.rightYellowStart = _configRight.yellowStart;
                this.rightYellowEnd = _configRight.yellowEnd;
                this.rightRedStart = _configRight.redStart;
                this.rightRedEnd = _configRight.redEnd;
                if (_configRight.__Type == "ColorRangeDisplay3") {
                    this.rightLowYellowStart = _configRight.lowYellowStart;
                    this.rightLowYellowEnd = _configRight.lowYellowEnd;
                    this.rightLowRedStart = _configRight.lowRedStart;
                    this.rightLowRedEnd = _configRight.lowRedEnd;
                }
            }
        }
        this.prefixLeft = _prefixLeft;
        this.prefixRight = _prefixRight;
    }
    init() {
        this.leftGreen = this.instrument.getChildById(this.prefixLeft + "_Green");
        this.leftYellow = this.instrument.getChildById(this.prefixLeft + "_Yellow");
        this.leftRed = this.instrument.getChildById(this.prefixLeft + "_Red");
        this.leftLowYellow = this.instrument.getChildById(this.prefixLeft + "_LowYellow");
        this.leftLowRed = this.instrument.getChildById(this.prefixLeft + "_LowRed");
        this.leftCursor = this.instrument.getChildById(this.prefixLeft + "_Cursor");
        this.leftValue_Outline = this.instrument.getChildById(this.prefixLeft + "_Value_Outline");
        this.leftValue = this.instrument.getChildById(this.prefixLeft + "_Value");
        this.rightGreen = this.instrument.getChildById(this.prefixRight + "_Green");
        this.rightYellow = this.instrument.getChildById(this.prefixRight + "_Yellow");
        this.rightRed = this.instrument.getChildById(this.prefixRight + "_Red");
        this.rightLowYellow = this.instrument.getChildById(this.prefixRight + "_LowYellow");
        this.rightLowRed = this.instrument.getChildById(this.prefixRight + "_LowRed");
        this.rightCursor = this.instrument.getChildById(this.prefixRight + "_Cursor");
        this.rightValue_Outline = this.instrument.getChildById(this.prefixRight + "_Value_Outline");
        this.rightValue = this.instrument.getChildById(this.prefixRight + "_Value");
        let leftGreenBeginAngle = this.valueToAngleLeft(this.leftGreenStart);
        let leftGreenEndAngle = this.valueToAngleLeft(this.leftGreenEnd);
        let leftGreenBeginSin = Math.sin(leftGreenBeginAngle);
        let leftGreenBeginCos = Math.cos(leftGreenBeginAngle);
        let leftGreenEndSin = Math.sin(leftGreenEndAngle);
        let leftGreenEndCos = Math.cos(leftGreenEndAngle);
        let leftGreenBigFlag = ((leftGreenEndAngle - leftGreenBeginAngle) <= Math.PI) ? "0" : "1";
        this.leftGreen.setAttribute("d", "M" + (35 - (leftGreenBeginCos * 25)) + " " + (30 - (leftGreenBeginSin * 25)) + " A25 25 0 " + leftGreenBigFlag + " 1 " + (35 - (leftGreenEndCos * 25)) + " " + (30 - (leftGreenEndSin * 25)) + " L" + (35 - (leftGreenEndCos * 30)) + " " + (30 - (leftGreenEndSin * 30)) + "  A30 30 0 " + leftGreenBigFlag + " 0 " + (35 - (leftGreenBeginCos * 30)) + " " + (30 - (leftGreenBeginSin * 30)) + " Z");
        let leftRedBeginAngle = this.valueToAngleLeft(this.leftRedStart);
        let leftRedEndAngle = this.valueToAngleLeft(this.leftRedEnd);
        let leftRedBeginSin = Math.sin(leftRedBeginAngle);
        let leftRedBeginCos = Math.cos(leftRedBeginAngle);
        let leftRedEndSin = Math.sin(leftRedEndAngle);
        let leftRedEndCos = Math.cos(leftRedEndAngle);
        let leftRedBigFlag = ((leftRedEndAngle - leftRedBeginAngle) <= Math.PI) ? "0" : "1";
        this.leftRed.setAttribute("d", "M" + (35 - (leftRedBeginCos * 25)) + " " + (30 - (leftRedBeginSin * 25)) + " A25 25 0 " + leftRedBigFlag + " 1 " + (35 - (leftRedEndCos * 25)) + " " + (30 - (leftRedEndSin * 25)) + " L" + (35 - (leftRedEndCos * 30)) + " " + (30 - (leftRedEndSin * 30)) + "  A30 30 0 " + leftRedBigFlag + " 0 " + (35 - (leftRedBeginCos * 30)) + " " + (30 - (leftRedBeginSin * 30)) + " Z");
        let leftYellowBeginAngle = this.valueToAngleLeft(this.leftYellowStart);
        let leftYellowEndAngle = this.valueToAngleLeft(this.leftYellowEnd);
        let leftYellowBeginSin = Math.sin(leftYellowBeginAngle);
        let leftYellowBeginCos = Math.cos(leftYellowBeginAngle);
        let leftYellowEndSin = Math.sin(leftYellowEndAngle);
        let leftYellowEndCos = Math.cos(leftYellowEndAngle);
        let leftYellowBigFlag = ((leftYellowEndAngle - leftYellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.leftYellow.setAttribute("d", "M" + (35 - (leftYellowBeginCos * 25)) + " " + (30 - (leftYellowBeginSin * 25)) + " A25 25 0 " + leftYellowBigFlag + " 1 " + (35 - (leftYellowEndCos * 25)) + " " + (30 - (leftYellowEndSin * 25)) + " L" + (35 - (leftYellowEndCos * 30)) + " " + (30 - (leftYellowEndSin * 30)) + "  A30 30 0 " + leftYellowBigFlag + " 0 " + (35 - (leftYellowBeginCos * 30)) + " " + (30 - (leftYellowBeginSin * 30)) + " Z");
        let leftLowRedBeginAngle = this.valueToAngleLeft(this.leftLowRedStart);
        let leftLowRedEndAngle = this.valueToAngleLeft(this.leftLowRedEnd);
        let leftLowRedBeginSin = Math.sin(leftLowRedBeginAngle);
        let leftLowRedBeginCos = Math.cos(leftLowRedBeginAngle);
        let leftLowRedEndSin = Math.sin(leftLowRedEndAngle);
        let leftLowRedEndCos = Math.cos(leftLowRedEndAngle);
        let leftLowRedBigFlag = ((leftLowRedEndAngle - leftLowRedBeginAngle) <= Math.PI) ? "0" : "1";
        this.leftLowRed.setAttribute("d", "M" + (35 - (leftLowRedBeginCos * 25)) + " " + (30 - (leftLowRedBeginSin * 25)) + " A25 25 0 " + leftLowRedBigFlag + " 1 " + (35 - (leftLowRedEndCos * 25)) + " " + (30 - (leftLowRedEndSin * 25)) + " L" + (35 - (leftLowRedEndCos * 30)) + " " + (30 - (leftLowRedEndSin * 30)) + "  A30 30 0 " + leftLowRedBigFlag + " 0 " + (35 - (leftLowRedBeginCos * 30)) + " " + (30 - (leftLowRedBeginSin * 30)) + " Z");
        let leftLowYellowBeginAngle = this.valueToAngleLeft(this.leftLowYellowStart);
        let leftLowYellowEndAngle = this.valueToAngleLeft(this.leftLowYellowEnd);
        let leftLowYellowBeginSin = Math.sin(leftLowYellowBeginAngle);
        let leftLowYellowBeginCos = Math.cos(leftLowYellowBeginAngle);
        let leftLowYellowEndSin = Math.sin(leftLowYellowEndAngle);
        let leftLowYellowEndCos = Math.cos(leftLowYellowEndAngle);
        let leftLowYellowBigFlag = ((leftLowYellowEndAngle - leftLowYellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.leftLowYellow.setAttribute("d", "M" + (35 - (leftLowYellowBeginCos * 25)) + " " + (30 - (leftLowYellowBeginSin * 25)) + " A25 25 0 " + leftLowYellowBigFlag + " 1 " + (35 - (leftLowYellowEndCos * 25)) + " " + (30 - (leftLowYellowEndSin * 25)) + " L" + (35 - (leftLowYellowEndCos * 30)) + " " + (30 - (leftLowYellowEndSin * 30)) + "  A30 30 0 " + leftLowYellowBigFlag + " 0 " + (35 - (leftLowYellowBeginCos * 30)) + " " + (30 - (leftLowYellowBeginSin * 30)) + " Z");
        let rightGreenBeginAngle = this.valueToAngleRight(this.rightGreenStart);
        let rightGreenEndAngle = this.valueToAngleRight(this.rightGreenEnd);
        let rightGreenBeginSin = Math.sin(rightGreenBeginAngle);
        let rightGreenBeginCos = Math.cos(rightGreenBeginAngle);
        let rightGreenEndSin = Math.sin(rightGreenEndAngle);
        let rightGreenEndCos = Math.cos(rightGreenEndAngle);
        let rightGreenBigFlag = ((rightGreenEndAngle - rightGreenBeginAngle) <= Math.PI) ? "0" : "1";
        this.rightGreen.setAttribute("d", "M" + (35 + (rightGreenBeginCos * 25)) + " " + (30 - (rightGreenBeginSin * 25)) + " A25 25 0 " + rightGreenBigFlag + " 0 " + (35 + (rightGreenEndCos * 25)) + " " + (30 - (rightGreenEndSin * 25)) + " L" + (35 + (rightGreenEndCos * 30)) + " " + (30 - (rightGreenEndSin * 30)) + "  A30 30 0 " + rightGreenBigFlag + " 1 " + (35 + (rightGreenBeginCos * 30)) + " " + (30 - (rightGreenBeginSin * 30)) + " Z");
        let rightRedBeginAngle = this.valueToAngleRight(this.rightRedStart);
        let rightRedEndAngle = this.valueToAngleRight(this.rightRedEnd);
        let rightRedBeginSin = Math.sin(rightRedBeginAngle);
        let rightRedBeginCos = Math.cos(rightRedBeginAngle);
        let rightRedEndSin = Math.sin(rightRedEndAngle);
        let rightRedEndCos = Math.cos(rightRedEndAngle);
        let rightRedBigFlag = ((rightRedEndAngle - rightRedBeginAngle) <= Math.PI) ? "0" : "1";
        this.rightRed.setAttribute("d", "M" + (35 + (rightRedBeginCos * 25)) + " " + (30 - (rightRedBeginSin * 25)) + " A25 25 0 " + rightRedBigFlag + " 0 " + (35 + (rightRedEndCos * 25)) + " " + (30 - (rightRedEndSin * 25)) + " L" + (35 + (rightRedEndCos * 30)) + " " + (30 - (rightRedEndSin * 30)) + "  A30 30 0 " + rightRedBigFlag + " 1 " + (35 + (rightRedBeginCos * 30)) + " " + (30 - (rightRedBeginSin * 30)) + " Z");
        let rightYellowBeginAngle = this.valueToAngleRight(this.rightYellowStart);
        let rightYellowEndAngle = this.valueToAngleRight(this.rightYellowEnd);
        let rightYellowBeginSin = Math.sin(rightYellowBeginAngle);
        let rightYellowBeginCos = Math.cos(rightYellowBeginAngle);
        let rightYellowEndSin = Math.sin(rightYellowEndAngle);
        let rightYellowEndCos = Math.cos(rightYellowEndAngle);
        let rightYellowBigFlag = ((rightYellowEndAngle - rightYellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.rightYellow.setAttribute("d", "M" + (35 + (rightYellowBeginCos * 25)) + " " + (30 - (rightYellowBeginSin * 25)) + " A25 25 0 " + rightYellowBigFlag + " 0 " + (35 + (rightYellowEndCos * 25)) + " " + (30 - (rightYellowEndSin * 25)) + " L" + (35 + (rightYellowEndCos * 30)) + " " + (30 - (rightYellowEndSin * 30)) + "  A30 30 0 " + rightYellowBigFlag + " 1 " + (35 + (rightYellowBeginCos * 30)) + " " + (30 - (rightYellowBeginSin * 30)) + " Z");
        let rightLowRedBeginAngle = this.valueToAngleRight(this.rightLowRedStart);
        let rightLowRedEndAngle = this.valueToAngleRight(this.rightLowRedEnd);
        let rightLowRedBeginSin = Math.sin(rightLowRedBeginAngle);
        let rightLowRedBeginCos = Math.cos(rightLowRedBeginAngle);
        let rightLowRedEndSin = Math.sin(rightLowRedEndAngle);
        let rightLowRedEndCos = Math.cos(rightLowRedEndAngle);
        let rightLowRedBigFlag = ((rightLowRedEndAngle - rightLowRedBeginAngle) <= Math.PI) ? "0" : "1";
        this.rightLowRed.setAttribute("d", "M" + (35 + (rightLowRedBeginCos * 25)) + " " + (30 - (rightLowRedBeginSin * 25)) + " A25 25 0 " + rightLowRedBigFlag + " 0 " + (35 + (rightLowRedEndCos * 25)) + " " + (30 - (rightLowRedEndSin * 25)) + " L" + (35 + (rightLowRedEndCos * 30)) + " " + (30 - (rightLowRedEndSin * 30)) + "  A30 30 0 " + rightLowRedBigFlag + " 1 " + (35 + (rightLowRedBeginCos * 30)) + " " + (30 - (rightLowRedBeginSin * 30)) + " Z");
        let rightLowYellowBeginAngle = this.valueToAngleRight(this.rightLowYellowStart);
        let rightLowYellowEndAngle = this.valueToAngleRight(this.rightLowYellowEnd);
        let rightLowYellowBeginSin = Math.sin(rightLowYellowBeginAngle);
        let rightLowYellowBeginCos = Math.cos(rightLowYellowBeginAngle);
        let rightLowYellowEndSin = Math.sin(rightLowYellowEndAngle);
        let rightLowYellowEndCos = Math.cos(rightLowYellowEndAngle);
        let rightLowYellowBigFlag = ((rightLowYellowEndAngle - rightLowYellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.rightLowYellow.setAttribute("d", "M" + (35 + (rightLowYellowBeginCos * 25)) + " " + (30 - (rightLowYellowBeginSin * 25)) + " A25 25 0 " + rightLowYellowBigFlag + " 0 " + (35 + (rightLowYellowEndCos * 25)) + " " + (30 - (rightLowYellowEndSin * 25)) + " L" + (35 + (rightLowYellowEndCos * 30)) + " " + (30 - (rightLowYellowEndSin * 30)) + "  A30 30 0 " + rightLowYellowBigFlag + " 1 " + (35 + (rightLowYellowBeginCos * 30)) + " " + (30 - (rightLowYellowBeginSin * 30)) + " Z");
    }
    setValues(_textLeft, _valueLeft, _textRight, _valueRight) {
        if ((_valueLeft < this.leftRedEnd && _valueLeft >= this.leftRedStart) || (_valueLeft < this.leftLowRedEnd && _valueLeft >= this.leftLowRedStart)) {
            this.leftValue_Outline.setAttribute("stroke", "red");
        }
        else if ((_valueLeft < this.leftYellowEnd && _valueLeft >= this.leftYellowStart) || (_valueLeft < this.leftLowYellowEnd && _valueLeft >= this.leftLowYellowStart)) {
            this.leftValue_Outline.setAttribute("stroke", "yellow");
        }
        else if (_valueLeft < this.leftGreenEnd && _valueLeft >= this.leftGreenStart) {
            this.leftValue_Outline.setAttribute("stroke", "green");
        }
        else {
            this.leftValue_Outline.setAttribute("stroke", "white");
        }
        this.leftValue.textContent = _textLeft;
        let leftCursorBeginAngle = this.valueToAngleLeft(_valueLeft);
        let leftCursorBeginSin = Math.sin(leftCursorBeginAngle);
        let leftCursorBeginCos = Math.cos(leftCursorBeginAngle);
        let leftCursorEndAngle = 1.43;
        let leftCursorEndSin = Math.sin(leftCursorEndAngle);
        let leftCursorEndCos = Math.cos(leftCursorEndAngle);
        let leftCursorBigFlag = ((leftCursorEndAngle - leftCursorBeginAngle) <= Math.PI) ? "0" : "1";
        this.leftCursor.setAttribute("d", "M" + (35 - (leftCursorBeginCos * 26)) + " " + (30 - (leftCursorBeginSin * 26)) + " A26 26 0 " + leftCursorBigFlag + " 1 " + (35 - (leftCursorEndCos * 26)) + " " + (30 - (leftCursorEndSin * 26)) + " L" + (35 - (leftCursorEndCos * 29)) + " " + (30 - (leftCursorEndSin * 29)) + "  A29 29 0 " + leftCursorBigFlag + " 0 " + (35 - (leftCursorBeginCos * 29)) + " " + (30 - (leftCursorBeginSin * 29)) + " Z");
        if ((_valueRight < this.rightRedEnd && _valueRight >= this.rightRedStart) || (_valueRight < this.rightLowRedEnd && _valueRight >= this.rightLowRedStart)) {
            this.rightValue_Outline.setAttribute("stroke", "red");
        }
        else if ((_valueRight < this.rightYellowEnd && _valueRight >= this.rightYellowStart) || (_valueRight < this.rightLowYellowEnd && _valueRight >= this.rightLowYellowStart)) {
            this.rightValue_Outline.setAttribute("stroke", "yellow");
        }
        else if (_valueRight < this.rightGreenEnd && _valueRight >= this.rightGreenStart) {
            this.rightValue_Outline.setAttribute("stroke", "green");
        }
        else {
            this.rightValue_Outline.setAttribute("stroke", "white");
        }
        this.rightValue.textContent = _textRight;
        let rightCursorBeginAngle = this.valueToAngleRight(_valueRight);
        let rightCursorBeginSin = Math.sin(rightCursorBeginAngle);
        let rightCursorBeginCos = Math.cos(rightCursorBeginAngle);
        let rightCursorEndAngle = 1.43;
        let rightCursorEndSin = Math.sin(rightCursorEndAngle);
        let rightCursorEndCos = Math.cos(rightCursorEndAngle);
        let rightCursorBigFlag = ((rightCursorEndAngle - rightCursorBeginAngle) <= Math.PI) ? "0" : "1";
        this.rightCursor.setAttribute("d", "M" + (35 + (rightCursorBeginCos * 26)) + " " + (30 - (rightCursorBeginSin * 26)) + " A26 26 0 " + rightCursorBigFlag + " 0 " + (35 + (rightCursorEndCos * 26)) + " " + (30 - (rightCursorEndSin * 26)) + " L" + (35 + (rightCursorEndCos * 29)) + " " + (30 - (rightCursorEndSin * 29)) + "  A29 29 0 " + rightCursorBigFlag + " 1 " + (35 + (rightCursorBeginCos * 29)) + " " + (30 - (rightCursorBeginSin * 29)) + " Z");
    }
    valueToAngleRight(_value) {
        if ((this.rightMaxValue - this.rightMinValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.rightMinValue) / (this.rightMaxValue - this.rightMinValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
    valueToAngleLeft(_value) {
        if ((this.leftMaxValue - this.leftMinValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.leftMinValue) / (this.leftMaxValue - this.leftMinValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
}
class Vigilus_Oil extends Vigilus_DoubleCircle {
    update() {
        let left = SimVar.GetSimVarValue("ENG OIL PRESSURE:1", "psi");
        let right = SimVar.GetSimVarValue("ENG OIL TEMPERATURE:1", "farenheit");
        this.setValues(left.toFixed(1), left, fastToFixed(right, 0), right);
    }
}
class Vigilus_FuelQuantity extends Vigilus_DoubleCircle {
    update() {
        let left = this.leftQty ? this.leftQty.getValueAsNumber() : SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "gallons");
        let right = this.rightQty ? this.rightQty.getValueAsNumber() : (SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallons") + SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallons"));
        let leftCapacity = this.leftCapacity ? this.leftCapacity.getValueAsNumber() : SimVar.GetSimVarValue("FUEL TANK CENTER CAPACITY", "gallons");
        let rightCapacity = this.rightCapacity ? this.rightCapacity.getValueAsNumber() : (SimVar.GetSimVarValue("FUEL LEFT CAPACITY", "gallons") + SimVar.GetSimVarValue("FUEL RIGHT CAPACITY", "gallons"));
        this.setValues(left.toFixed(1), (left * 100) / leftCapacity, fastToFixed(right, 0), (right * 100) / rightCapacity);
    }
}
class Vigilus_OAT extends Vigilus_Gauge {
    constructor() {
        super(...arguments);
        this.minPos = 0;
        this.maxPos = 45;
        this.minValue = 0;
        this.maxValue = 100;
    }
    init() {
        this.text = this.instrument.getChildById("OAT_Value");
        this.cursor = this.instrument.getChildById("OAT_Cursor");
    }
    update() {
        let oat = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        this.text.textContent = fastToFixed(oat, 0);
        this.cursor.setAttribute("height", (this.maxPos - this.valueToPos(oat)).toString());
    }
    valueToPos(_value) {
        if ((this.maxValue - this.minValue) == 0)
            return this.minPos;
        return Math.max(this.minPos, Math.min(this.maxPos, ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.maxPos - this.minPos) + this.minPos));
    }
}
class Vigilus_FuelPress extends Vigilus_Gauge {
    constructor(_instrument, _config) {
        super(_instrument);
        this.minAngle = -0.698132;
        this.maxAngle = 3.839724;
        this.minValue = 0;
        this.maxValue = 0;
        this.greenStart = 0;
        this.greenEnd = 0;
        this.yellowStart = 0;
        this.yellowEnd = 0;
        this.redStart = 0;
        this.redEnd = 0;
        this.lowYellowStart = 0;
        this.lowYellowEnd = 0;
        this.lowRedStart = 0;
        this.lowRedEnd = 0;
        this.minValue = _config.min;
        this.maxValue = _config.max;
        this.greenStart = _config.greenStart;
        this.greenEnd = _config.greenEnd;
        this.yellowStart = _config.yellowStart;
        this.yellowEnd = _config.yellowEnd;
        this.redStart = _config.redStart;
        this.redEnd = _config.redEnd;
        this.lowYellowStart = _config.lowYellowStart;
        this.lowYellowEnd = _config.lowYellowEnd;
        this.lowRedStart = _config.lowRedStart;
        this.lowRedEnd = _config.lowRedEnd;
    }
    init() {
        this.green = this.instrument.getChildById("FuelPress_Green");
        this.yellow = this.instrument.getChildById("FuelPress_Yellow");
        this.red = this.instrument.getChildById("FuelPress_Red");
        this.lowYellow = this.instrument.getChildById("FuelPress_LowYellow");
        this.lowRed = this.instrument.getChildById("FuelPress_LowRed");
        this.cursor = this.instrument.getChildById("FuelPress_Cursor");
        this.value_Outline = this.instrument.getChildById("FuelPress_Value_Outline");
        this.value = this.instrument.getChildById("FuelPress_Value");
        let greenBeginAngle = this.valueToAngle(this.greenStart);
        let greenEndAngle = this.valueToAngle(this.greenEnd);
        let greenBeginSin = Math.sin(greenBeginAngle);
        let greenBeginCos = Math.cos(greenBeginAngle);
        let greenEndSin = Math.sin(greenEndAngle);
        let greenEndCos = Math.cos(greenEndAngle);
        let greenBigFlag = ((greenEndAngle - greenBeginAngle) <= Math.PI) ? "0" : "1";
        this.green.setAttribute("d", "M" + (35 - (greenBeginCos * 25)) + " " + (30 - (greenBeginSin * 25)) + " A25 25 0 " + greenBigFlag + " 1 " + (35 - (greenEndCos * 25)) + " " + (30 - (greenEndSin * 25)) + " L" + (35 - (greenEndCos * 30)) + " " + (30 - (greenEndSin * 30)) + "  A30 30 0 " + greenBigFlag + " 0 " + (35 - (greenBeginCos * 30)) + " " + (30 - (greenBeginSin * 30)) + " Z");
        let redBeginAngle = this.valueToAngle(this.redStart);
        let redEndAngle = this.valueToAngle(this.redEnd);
        let redBeginSin = Math.sin(redBeginAngle);
        let redBeginCos = Math.cos(redBeginAngle);
        let redEndSin = Math.sin(redEndAngle);
        let redEndCos = Math.cos(redEndAngle);
        let redBigFlag = ((redEndAngle - redBeginAngle) <= Math.PI) ? "0" : "1";
        this.red.setAttribute("d", "M" + (35 - (redBeginCos * 25)) + " " + (30 - (redBeginSin * 25)) + " A25 25 0 " + redBigFlag + " 1 " + (35 - (redEndCos * 25)) + " " + (30 - (redEndSin * 25)) + " L" + (35 - (redEndCos * 30)) + " " + (30 - (redEndSin * 30)) + "  A30 30 0 " + redBigFlag + " 0 " + (35 - (redBeginCos * 30)) + " " + (30 - (redBeginSin * 30)) + " Z");
        let yellowBeginAngle = this.valueToAngle(this.yellowStart);
        let yellowEndAngle = this.valueToAngle(this.yellowEnd);
        let yellowBeginSin = Math.sin(yellowBeginAngle);
        let yellowBeginCos = Math.cos(yellowBeginAngle);
        let yellowEndSin = Math.sin(yellowEndAngle);
        let yellowEndCos = Math.cos(yellowEndAngle);
        let yellowBigFlag = ((yellowEndAngle - yellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.yellow.setAttribute("d", "M" + (35 - (yellowBeginCos * 25)) + " " + (30 - (yellowBeginSin * 25)) + " A25 25 0 " + yellowBigFlag + " 1 " + (35 - (yellowEndCos * 25)) + " " + (30 - (yellowEndSin * 25)) + " L" + (35 - (yellowEndCos * 30)) + " " + (30 - (yellowEndSin * 30)) + "  A30 30 0 " + yellowBigFlag + " 0 " + (35 - (yellowBeginCos * 30)) + " " + (30 - (yellowBeginSin * 30)) + " Z");
        let lowRedBeginAngle = this.valueToAngle(this.lowRedStart);
        let lowRedEndAngle = this.valueToAngle(this.lowRedEnd);
        let lowRedBeginSin = Math.sin(lowRedBeginAngle);
        let lowRedBeginCos = Math.cos(lowRedBeginAngle);
        let lowRedEndSin = Math.sin(lowRedEndAngle);
        let lowRedEndCos = Math.cos(lowRedEndAngle);
        let lowRedBigFlag = ((lowRedEndAngle - lowRedBeginAngle) <= Math.PI) ? "0" : "1";
        this.lowRed.setAttribute("d", "M" + (35 - (lowRedBeginCos * 25)) + " " + (30 - (lowRedBeginSin * 25)) + " A25 25 0 " + lowRedBigFlag + " 1 " + (35 - (lowRedEndCos * 25)) + " " + (30 - (lowRedEndSin * 25)) + " L" + (35 - (lowRedEndCos * 30)) + " " + (30 - (lowRedEndSin * 30)) + "  A30 30 0 " + lowRedBigFlag + " 0 " + (35 - (lowRedBeginCos * 30)) + " " + (30 - (lowRedBeginSin * 30)) + " Z");
        let lowYellowBeginAngle = this.valueToAngle(this.lowYellowStart);
        let lowYellowEndAngle = this.valueToAngle(this.lowYellowEnd);
        let lowYellowBeginSin = Math.sin(lowYellowBeginAngle);
        let lowYellowBeginCos = Math.cos(lowYellowBeginAngle);
        let lowYellowEndSin = Math.sin(lowYellowEndAngle);
        let lowYellowEndCos = Math.cos(lowYellowEndAngle);
        let lowYellowBigFlag = ((lowYellowEndAngle - lowYellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.lowYellow.setAttribute("d", "M" + (35 - (lowYellowBeginCos * 25)) + " " + (30 - (lowYellowBeginSin * 25)) + " A25 25 0 " + lowYellowBigFlag + " 1 " + (35 - (lowYellowEndCos * 25)) + " " + (30 - (lowYellowEndSin * 25)) + " L" + (35 - (lowYellowEndCos * 30)) + " " + (30 - (lowYellowEndSin * 30)) + "  A30 30 0 " + lowYellowBigFlag + " 0 " + (35 - (lowYellowBeginCos * 30)) + " " + (30 - (lowYellowBeginSin * 30)) + " Z");
    }
    update() {
        let fuelPress = SimVar.GetSimVarValue("GENERAL ENG FUEL PRESSURE:1", "psi");
        if ((fuelPress < this.redEnd && fuelPress >= this.redStart) || (fuelPress < this.lowRedEnd && fuelPress >= this.lowRedStart)) {
            this.value_Outline.setAttribute("stroke", "red");
        }
        else if ((fuelPress < this.yellowEnd && fuelPress >= this.yellowStart) || (fuelPress < this.lowYellowEnd && fuelPress >= this.lowYellowStart)) {
            this.value_Outline.setAttribute("stroke", "yellow");
        }
        else if (fuelPress < this.greenEnd && fuelPress >= this.greenStart) {
            this.value_Outline.setAttribute("stroke", "green");
        }
        else {
            this.value_Outline.setAttribute("stroke", "white");
        }
        this.value.textContent = fuelPress.toFixed(2);
        let cursorBeginAngle = this.valueToAngle(fuelPress);
        let cursorBeginSin = Math.sin(cursorBeginAngle);
        let cursorBeginCos = Math.cos(cursorBeginAngle);
        let cursorEndAngle = 3.82;
        let cursorEndSin = Math.sin(cursorEndAngle);
        let cursorEndCos = Math.cos(cursorEndAngle);
        let cursorBigFlag = ((cursorEndAngle - cursorBeginAngle) <= Math.PI) ? "0" : "1";
        this.cursor.setAttribute("d", "M" + (35 - (cursorBeginCos * 26)) + " " + (30 - (cursorBeginSin * 26)) + " A26 26 0 " + cursorBigFlag + " 1 " + (35 - (cursorEndCos * 26)) + " " + (30 - (cursorEndSin * 26)) + " L" + (35 - (cursorEndCos * 29)) + " " + (30 - (cursorEndSin * 29)) + "  A29 29 0 " + cursorBigFlag + " 0 " + (35 - (cursorBeginCos * 29)) + " " + (30 - (cursorBeginSin * 29)) + " Z");
    }
    valueToAngle(_value) {
        if ((this.maxValue - this.minValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
}
class Vigilus_Volts extends Vigilus_Gauge {
    constructor(_instrument, _config) {
        super(_instrument);
        this.minAngle = -0.698132;
        this.maxAngle = 3.839724;
        this.minValue = 0;
        this.maxValue = 0;
        this.greenStart = 0;
        this.greenEnd = 0;
        this.yellowStart = 0;
        this.yellowEnd = 0;
        this.redStart = 0;
        this.redEnd = 0;
        this.lowYellowStart = 0;
        this.lowYellowEnd = 0;
        this.lowRedStart = 0;
        this.lowRedEnd = 0;
        this.minValue = _config.min;
        this.maxValue = _config.max;
        this.greenStart = _config.greenStart;
        this.greenEnd = _config.greenEnd;
        this.yellowStart = _config.yellowStart;
        this.yellowEnd = _config.yellowEnd;
        this.redStart = _config.redStart;
        this.redEnd = _config.redEnd;
        this.lowYellowStart = _config.lowYellowStart;
        this.lowYellowEnd = _config.lowYellowEnd;
        this.lowRedStart = _config.lowRedStart;
        this.lowRedEnd = _config.lowRedEnd;
    }
    init() {
        this.green = this.instrument.getChildById("Volts_Green");
        this.yellow = this.instrument.getChildById("Volts_Yellow");
        this.red = this.instrument.getChildById("Volts_Red");
        this.lowYellow = this.instrument.getChildById("Volts_LowYellow");
        this.lowRed = this.instrument.getChildById("Volts_LowRed");
        this.cursor = this.instrument.getChildById("Volts_Cursor");
        this.value_Outline = this.instrument.getChildById("Volts_Value_Outline");
        this.value = this.instrument.getChildById("Volts_Value");
        let greenBeginAngle = this.valueToAngle(this.greenStart);
        let greenEndAngle = this.valueToAngle(this.greenEnd);
        let greenBeginSin = Math.sin(greenBeginAngle);
        let greenBeginCos = Math.cos(greenBeginAngle);
        let greenEndSin = Math.sin(greenEndAngle);
        let greenEndCos = Math.cos(greenEndAngle);
        let greenBigFlag = ((greenEndAngle - greenBeginAngle) <= Math.PI) ? "0" : "1";
        this.green.setAttribute("d", "M" + (35 - (greenBeginCos * 25)) + " " + (30 - (greenBeginSin * 25)) + " A25 25 0 " + greenBigFlag + " 1 " + (35 - (greenEndCos * 25)) + " " + (30 - (greenEndSin * 25)) + " L" + (35 - (greenEndCos * 30)) + " " + (30 - (greenEndSin * 30)) + "  A30 30 0 " + greenBigFlag + " 0 " + (35 - (greenBeginCos * 30)) + " " + (30 - (greenBeginSin * 30)) + " Z");
        let redBeginAngle = this.valueToAngle(this.redStart);
        let redEndAngle = this.valueToAngle(this.redEnd);
        let redBeginSin = Math.sin(redBeginAngle);
        let redBeginCos = Math.cos(redBeginAngle);
        let redEndSin = Math.sin(redEndAngle);
        let redEndCos = Math.cos(redEndAngle);
        let redBigFlag = ((redEndAngle - redBeginAngle) <= Math.PI) ? "0" : "1";
        this.red.setAttribute("d", "M" + (35 - (redBeginCos * 25)) + " " + (30 - (redBeginSin * 25)) + " A25 25 0 " + redBigFlag + " 1 " + (35 - (redEndCos * 25)) + " " + (30 - (redEndSin * 25)) + " L" + (35 - (redEndCos * 30)) + " " + (30 - (redEndSin * 30)) + "  A30 30 0 " + redBigFlag + " 0 " + (35 - (redBeginCos * 30)) + " " + (30 - (redBeginSin * 30)) + " Z");
        let yellowBeginAngle = this.valueToAngle(this.yellowStart);
        let yellowEndAngle = this.valueToAngle(this.yellowEnd);
        let yellowBeginSin = Math.sin(yellowBeginAngle);
        let yellowBeginCos = Math.cos(yellowBeginAngle);
        let yellowEndSin = Math.sin(yellowEndAngle);
        let yellowEndCos = Math.cos(yellowEndAngle);
        let yellowBigFlag = ((yellowEndAngle - yellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.yellow.setAttribute("d", "M" + (35 - (yellowBeginCos * 25)) + " " + (30 - (yellowBeginSin * 25)) + " A25 25 0 " + yellowBigFlag + " 1 " + (35 - (yellowEndCos * 25)) + " " + (30 - (yellowEndSin * 25)) + " L" + (35 - (yellowEndCos * 30)) + " " + (30 - (yellowEndSin * 30)) + "  A30 30 0 " + yellowBigFlag + " 0 " + (35 - (yellowBeginCos * 30)) + " " + (30 - (yellowBeginSin * 30)) + " Z");
        let lowRedBeginAngle = this.valueToAngle(this.lowRedStart);
        let lowRedEndAngle = this.valueToAngle(this.lowRedEnd);
        let lowRedBeginSin = Math.sin(lowRedBeginAngle);
        let lowRedBeginCos = Math.cos(lowRedBeginAngle);
        let lowRedEndSin = Math.sin(lowRedEndAngle);
        let lowRedEndCos = Math.cos(lowRedEndAngle);
        let lowRedBigFlag = ((lowRedEndAngle - lowRedBeginAngle) <= Math.PI) ? "0" : "1";
        this.lowRed.setAttribute("d", "M" + (35 - (lowRedBeginCos * 25)) + " " + (30 - (lowRedBeginSin * 25)) + " A25 25 0 " + lowRedBigFlag + " 1 " + (35 - (lowRedEndCos * 25)) + " " + (30 - (lowRedEndSin * 25)) + " L" + (35 - (lowRedEndCos * 30)) + " " + (30 - (lowRedEndSin * 30)) + "  A30 30 0 " + lowRedBigFlag + " 0 " + (35 - (lowRedBeginCos * 30)) + " " + (30 - (lowRedBeginSin * 30)) + " Z");
        let lowYellowBeginAngle = this.valueToAngle(this.lowYellowStart);
        let lowYellowEndAngle = this.valueToAngle(this.lowYellowEnd);
        let lowYellowBeginSin = Math.sin(lowYellowBeginAngle);
        let lowYellowBeginCos = Math.cos(lowYellowBeginAngle);
        let lowYellowEndSin = Math.sin(lowYellowEndAngle);
        let lowYellowEndCos = Math.cos(lowYellowEndAngle);
        let lowYellowBigFlag = ((lowYellowEndAngle - lowYellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.lowYellow.setAttribute("d", "M" + (35 - (lowYellowBeginCos * 25)) + " " + (30 - (lowYellowBeginSin * 25)) + " A25 25 0 " + lowYellowBigFlag + " 1 " + (35 - (lowYellowEndCos * 25)) + " " + (30 - (lowYellowEndSin * 25)) + " L" + (35 - (lowYellowEndCos * 30)) + " " + (30 - (lowYellowEndSin * 30)) + "  A30 30 0 " + lowYellowBigFlag + " 0 " + (35 - (lowYellowBeginCos * 30)) + " " + (30 - (lowYellowBeginSin * 30)) + " Z");
    }
    update() {
        let volts = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "Volts");
        if ((volts < this.redEnd && volts >= this.redStart) || (volts < this.lowRedEnd && volts >= this.lowRedStart)) {
            this.value_Outline.setAttribute("stroke", "red");
        }
        else if ((volts < this.yellowEnd && volts >= this.yellowStart) || (volts < this.lowYellowEnd && volts >= this.lowYellowStart)) {
            this.value_Outline.setAttribute("stroke", "yellow");
        }
        else if (volts < this.greenEnd && volts >= this.greenStart) {
            this.value_Outline.setAttribute("stroke", "green");
        }
        else {
            this.value_Outline.setAttribute("stroke", "white");
        }
        this.value.textContent = volts.toFixed(1);
        let cursorBeginAngle = this.valueToAngle(volts);
        let cursorBeginSin = Math.sin(cursorBeginAngle);
        let cursorBeginCos = Math.cos(cursorBeginAngle);
        let cursorEndAngle = 3.82;
        let cursorEndSin = Math.sin(cursorEndAngle);
        let cursorEndCos = Math.cos(cursorEndAngle);
        let cursorBigFlag = ((cursorEndAngle - cursorBeginAngle) <= Math.PI) ? "0" : "1";
        this.cursor.setAttribute("d", "M" + (35 - (cursorBeginCos * 26)) + " " + (30 - (cursorBeginSin * 26)) + " A26 26 0 " + cursorBigFlag + " 1 " + (35 - (cursorEndCos * 26)) + " " + (30 - (cursorEndSin * 26)) + " L" + (35 - (cursorEndCos * 29)) + " " + (30 - (cursorEndSin * 29)) + "  A29 29 0 " + cursorBigFlag + " 0 " + (35 - (cursorBeginCos * 29)) + " " + (30 - (cursorBeginSin * 29)) + " Z");
    }
    valueToAngle(_value) {
        if ((this.maxValue - this.minValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
}
class Vigilus_Amps extends Vigilus_Gauge {
    constructor(_instrument, _config) {
        super(_instrument);
        this.minAngle = -0.698132;
        this.maxAngle = 3.839724;
        this.minValue = 0;
        this.maxValue = 0;
        this.greenStart = 0;
        this.greenEnd = 0;
        this.yellowStart = 0;
        this.yellowEnd = 0;
        this.redStart = 0;
        this.redEnd = 0;
        this.minValue = _config.min;
        this.maxValue = _config.max;
        this.greenStart = _config.greenStart;
        this.greenEnd = _config.greenEnd;
        this.yellowStart = _config.yellowStart;
        this.yellowEnd = _config.yellowEnd;
        this.redStart = _config.redStart;
        this.redEnd = _config.redEnd;
    }
    init() {
        this.green = this.instrument.getChildById("Amps_Green");
        this.yellow = this.instrument.getChildById("Amps_Yellow");
        this.red = this.instrument.getChildById("Amps_Red");
        this.lowYellow = this.instrument.getChildById("Amps_LowYellow");
        this.lowRed = this.instrument.getChildById("Amps_LowRed");
        this.cursor = this.instrument.getChildById("Amps_Cursor");
        this.value_Outline = this.instrument.getChildById("Amps_Value_Outline");
        this.value = this.instrument.getChildById("Amps_Value");
        let greenBeginAngle = this.valueToAngle(this.greenStart);
        let greenEndAngle = this.valueToAngle(this.greenEnd);
        let greenBeginSin = Math.sin(greenBeginAngle);
        let greenBeginCos = Math.cos(greenBeginAngle);
        let greenEndSin = Math.sin(greenEndAngle);
        let greenEndCos = Math.cos(greenEndAngle);
        let greenBigFlag = ((greenEndAngle - greenBeginAngle) <= Math.PI) ? "0" : "1";
        this.green.setAttribute("d", "M" + (35 - (greenBeginCos * 25)) + " " + (30 - (greenBeginSin * 25)) + " A25 25 0 " + greenBigFlag + " 1 " + (35 - (greenEndCos * 25)) + " " + (30 - (greenEndSin * 25)) + " L" + (35 - (greenEndCos * 30)) + " " + (30 - (greenEndSin * 30)) + "  A30 30 0 " + greenBigFlag + " 0 " + (35 - (greenBeginCos * 30)) + " " + (30 - (greenBeginSin * 30)) + " Z");
        let redBeginAngle = this.valueToAngle(this.redStart);
        let redEndAngle = this.valueToAngle(this.redEnd);
        let redBeginSin = Math.sin(redBeginAngle);
        let redBeginCos = Math.cos(redBeginAngle);
        let redEndSin = Math.sin(redEndAngle);
        let redEndCos = Math.cos(redEndAngle);
        let redBigFlag = ((redEndAngle - redBeginAngle) <= Math.PI) ? "0" : "1";
        this.red.setAttribute("d", "M" + (35 - (redBeginCos * 25)) + " " + (30 - (redBeginSin * 25)) + " A25 25 0 " + redBigFlag + " 1 " + (35 - (redEndCos * 25)) + " " + (30 - (redEndSin * 25)) + " L" + (35 - (redEndCos * 30)) + " " + (30 - (redEndSin * 30)) + "  A30 30 0 " + redBigFlag + " 0 " + (35 - (redBeginCos * 30)) + " " + (30 - (redBeginSin * 30)) + " Z");
        let yellowBeginAngle = this.valueToAngle(this.yellowStart);
        let yellowEndAngle = this.valueToAngle(this.yellowEnd);
        let yellowBeginSin = Math.sin(yellowBeginAngle);
        let yellowBeginCos = Math.cos(yellowBeginAngle);
        let yellowEndSin = Math.sin(yellowEndAngle);
        let yellowEndCos = Math.cos(yellowEndAngle);
        let yellowBigFlag = ((yellowEndAngle - yellowBeginAngle) <= Math.PI) ? "0" : "1";
        this.yellow.setAttribute("d", "M" + (35 - (yellowBeginCos * 25)) + " " + (30 - (yellowBeginSin * 25)) + " A25 25 0 " + yellowBigFlag + " 1 " + (35 - (yellowEndCos * 25)) + " " + (30 - (yellowEndSin * 25)) + " L" + (35 - (yellowEndCos * 30)) + " " + (30 - (yellowEndSin * 30)) + "  A30 30 0 " + yellowBigFlag + " 0 " + (35 - (yellowBeginCos * 30)) + " " + (30 - (yellowBeginSin * 30)) + " Z");
    }
    update() {
        let amps = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS AMPS", "Amperes");
        if ((amps < this.redEnd && amps >= this.redStart)) {
            this.value_Outline.setAttribute("stroke", "red");
        }
        else if ((amps < this.yellowEnd && amps >= this.yellowStart)) {
            this.value_Outline.setAttribute("stroke", "yellow");
        }
        else if (amps < this.greenEnd && amps >= this.greenStart) {
            this.value_Outline.setAttribute("stroke", "green");
        }
        else {
            this.value_Outline.setAttribute("stroke", "white");
        }
        this.value.textContent = amps.toFixed(1);
        let cursorBeginAngle = this.valueToAngle(amps);
        let cursorBeginSin = Math.sin(cursorBeginAngle);
        let cursorBeginCos = Math.cos(cursorBeginAngle);
        let cursorEndAngle = 3.82;
        let cursorEndSin = Math.sin(cursorEndAngle);
        let cursorEndCos = Math.cos(cursorEndAngle);
        let cursorBigFlag = ((cursorEndAngle - cursorBeginAngle) <= Math.PI) ? "0" : "1";
        this.cursor.setAttribute("d", "M" + (35 - (cursorBeginCos * 26)) + " " + (30 - (cursorBeginSin * 26)) + " A26 26 0 " + cursorBigFlag + " 1 " + (35 - (cursorEndCos * 26)) + " " + (30 - (cursorEndSin * 26)) + " L" + (35 - (cursorEndCos * 29)) + " " + (30 - (cursorEndSin * 29)) + "  A29 29 0 " + cursorBigFlag + " 0 " + (35 - (cursorBeginCos * 29)) + " " + (30 - (cursorBeginSin * 29)) + " Z");
    }
    valueToAngle(_value) {
        if ((this.maxValue - this.minValue) == 0)
            return this.minAngle;
        return Math.max(this.minAngle, Math.min(this.maxAngle, ((_value - this.minValue) / (this.maxValue - this.minValue)) * (this.maxAngle - this.minAngle) + this.minAngle));
    }
}
class Vigilus_FlightTime extends Vigilus_Gauge {
    constructor() {
        super(...arguments);
        this.isRunning = false;
        this.minRpm = 2000;
    }
    init() {
        this.valueElem = this.instrument.getChildById("FT_Value");
        if (this.instrument.instrumentXmlConfig) {
            let minRpmElem = this.instrument.instrumentXmlConfig.getElementsByTagName("FlightTimeRPMMinimum");
            if (minRpmElem.length > 0) {
                this.minRpm = parseFloat(minRpmElem[0].textContent);
            }
        }
    }
    update() {
        if (this.isRunning) {
            let time = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") - this.startTime;
            if (time < 0) {
                this.startTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            }
            let hours = Math.floor(Math.min(time / 3600, 99));
            let minutes = Math.floor((time % 3600) / 60);
            let seconds = Math.floor(time % 60);
            Avionics.Utils.diffAndSet(this.valueElem, (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
        }
        else {
            Avionics.Utils.diffAndSet(this.valueElem, "00:00:00");
            let rpm = SimVar.GetSimVarValue("GENERAL ENG RPM:1", "Rpm");
            if (rpm > this.minRpm) {
                this.startTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                this.isRunning = true;
            }
        }
    }
    onShutDown() {
        this.isRunning = false;
    }
}
class Vigilus_EGT extends Vigilus_Gauge {
    init() {
        this.valueElem = this.instrument.getChildById("EGT_Value");
    }
    update() {
        Avionics.Utils.diffAndSet(this.valueElem, fastToFixed(SimVar.GetSimVarValue("GENERAL ENG EXHAUST GAS TEMPERATURE:1", "celsius"), 0));
    }
}
class Vigilus_CHT extends Vigilus_Gauge {
    init() {
        this.valueElem = this.instrument.getChildById("CHT_Value");
    }
    update() {
        Avionics.Utils.diffAndSet(this.valueElem, fastToFixed(SimVar.GetSimVarValue("ENG CYLINDER HEAD TEMPERATURE:1", "celsius"), 0));
    }
}
registerInstrument("asvigilus-element", ASVigilus);
//# sourceMappingURL=ASVigilus.js.map