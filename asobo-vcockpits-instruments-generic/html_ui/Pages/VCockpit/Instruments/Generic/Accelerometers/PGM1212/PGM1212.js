var EPage;
(function (EPage) {
    EPage[EPage["DEFAULT"] = 0] = "DEFAULT";
    EPage[EPage["PILOT"] = 1] = "PILOT";
    EPage[EPage["FLIGHT"] = 2] = "FLIGHT";
    EPage[EPage["CLUB"] = 3] = "CLUB";
})(EPage || (EPage = {}));
class Page {
    constructor(_page, _topValue, _bottomValue1, _bottomValue2) {
        this.page = _page;
        this.topValue = _topValue;
        this.bottomValue1 = _bottomValue1;
        this.bottomValue2 = _bottomValue2;
    }
    show(_show) {
        if (this.page) {
            if (_show) {
                this.page.setAttribute("state", "on");
            }
            else {
                this.page.setAttribute("state", "off");
            }
        }
    }
    setTopValue(_value) {
        if (this.topValue)
            this.topValue.textContent = _value;
    }
    setBottomValue1(_value) {
        if (this.bottomValue1)
            this.bottomValue1.textContent = _value;
    }
    setBottomValue2(_value) {
        if (this.bottomValue2)
            this.bottomValue2.textContent = _value;
    }
}
class PGM1212 extends BaseInstrument {
    constructor() {
        super();
        this.Pages = new Array();
        this.DisplayedPageId = -1;
        this.WantedPageId = 0;
        this.PlusPressed = false;
        this.MinusPressed = false;
        this.GForceMax = 0;
        this.GForceMin = 0;
        this.flightCurTime = -1;
        this.flightStartTime = -1;
    }
    get templateID() { return "PGM1212"; }
    connectedCallback() {
        super.connectedCallback();
        this.Pages.push(new Page(this.getChildById("Default"), this.getChildById("DefaultTopValue"), this.getChildById("DefaultBottomValue1"), this.getChildById("DefaultBottomValue2")));
        this.Pages.push(new Page(this.getChildById("Pilot"), this.getChildById("PilotTopValue"), this.getChildById("PilotBottomValue"), null));
        this.Pages.push(new Page(this.getChildById("Flight"), this.getChildById("FlightTopValue"), this.getChildById("FlightBottomValue"), null));
        this.Pages.push(new Page(this.getChildById("Club"), this.getChildById("ClubTopValue"), this.getChildById("ClubBottomValue"), null));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (_args[0] == "okey_enter") {
            this.WantedPageId = EPage.DEFAULT;
            this.PlusPressed = false;
            this.MinusPressed = false;
        }
        else if (_args[0] == "okey_plus") {
            if (this.DisplayedPageId == EPage.DEFAULT)
                this.WantedPageId = EPage.PILOT;
            this.PlusPressed = true;
            this.MinusPressed = false;
        }
        else if (_args[0] == "okey_minus") {
            if (this.DisplayedPageId == EPage.DEFAULT)
                this.WantedPageId = EPage.PILOT;
            this.PlusPressed = false;
            this.MinusPressed = true;
        }
        else if (_args[0] == "okey_flgt") {
            this.WantedPageId = EPage.FLIGHT;
            this.PlusPressed = false;
            this.MinusPressed = false;
        }
        else if (_args[0] == "okey_club") {
            this.WantedPageId = EPage.CLUB;
            this.PlusPressed = false;
            this.MinusPressed = false;
        }
        else if (_args[0] == "okey_clear") {
            if (this.DisplayedPageId == EPage.PILOT) {
                this.GForceMax = 0;
                this.GForceMin = 0;
            }
        }
    }
    Update() {
        super.Update();
        var pageId = -1;
        if (this.flightStartTime <= 0) {
            this.flightStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            this.flightCurTime = this.flightStartTime;
        }
        if (this.CanUpdate()) {
            if (this.updateElectricity()) {
                pageId = this.WantedPageId;
                this.updateDisplay(pageId);
            }
        }
        if (pageId != this.DisplayedPageId) {
            for (var i = 0; i < this.Pages.length; i++) {
                if (pageId == i) {
                    this.Pages[i].show(true);
                }
                else {
                    this.Pages[i].show(false);
                }
            }
            this.DisplayedPageId = pageId;
        }
    }
    updateDisplay(_page) {
        var gForceCur = SimVar.GetSimVarValue("G FORCE", "GForce");
        if (gForceCur >= 0)
            this.Pages[_page].setTopValue("+" + gForceCur.toFixed(1) + " G");
        else
            this.Pages[_page].setTopValue("-" + gForceCur.toFixed(1) + " G");
        if (gForceCur > this.GForceMax)
            this.GForceMax = gForceCur;
        if (gForceCur < this.GForceMin)
            this.GForceMin = gForceCur;
        var gForceMax = SimVar.GetSimVarValue("MAX G FORCE", "GForce");
        var gForceMin = SimVar.GetSimVarValue("MIN G FORCE", "GForce");
        switch (_page) {
            case EPage.DEFAULT:
                {
                    {
                        var value = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                        if (value >= this.flightStartTime) {
                            this.flightCurTime = value - this.flightStartTime;
                        }
                        var flightDuration = Math.floor(this.flightCurTime * 100 / 3600);
                        this.Pages[_page].setBottomValue1(flightDuration.toString());
                    }
                    {
                        this.Pages[_page].setBottomValue2("0");
                    }
                    break;
                }
            case EPage.PILOT:
                {
                    if (!this.MinusPressed)
                        this.Pages[_page].setBottomValue1("+" + this.GForceMax.toFixed(1) + " G");
                    else
                        this.Pages[_page].setBottomValue1("-" + this.GForceMin.toFixed(1) + " G");
                    break;
                }
            case EPage.FLIGHT:
                {
                    if (!this.MinusPressed)
                        this.Pages[_page].setBottomValue1("+" + gForceMax.toFixed(1) + " G");
                    else
                        this.Pages[_page].setBottomValue1("-" + gForceMin.toFixed(1) + " G");
                    break;
                }
            case EPage.CLUB:
                {
                    if (!this.MinusPressed)
                        this.Pages[_page].setBottomValue1("+4.5 G");
                    else
                        this.Pages[_page].setBottomValue1("-3.0 G");
                    break;
                }
        }
    }
}
registerInstrument("pgm1212-element", PGM1212);
//# sourceMappingURL=PGM1212.js.map