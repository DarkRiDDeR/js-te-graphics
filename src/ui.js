import {_gOpt} from "./app";
import {getElByClass, on, off} from "./dom";

export default class UI {
    block;
    charts;
    obDraw;
    obSlDraw;
    start;
    finish;
    slLBl;
    slLBtn;
    slRange;
    slRBtn;
    slRBl;
    rx;
    w;
    clientXOld = 0;
    rateOfMouseSpeed = 8000; // rate factor of date
    timeOutOfMouseSpeed = 50;
    minRangeWidth = 10;
    hintPosition;
    isMouseHint = false;
    widthBtn;
    pos;
    _onCanvasMouseDown = (e) => this.onCanvasMouseDown(e);
    _onCanvasMouseMove = (e) => this.onCanvasMouseMove(e);
    _onChangeCheck = (e) => this.onChangeCheck(e);
    _onMouseDownSlLBtn = (e) => this.onMouseDownSlLBtn(e);
    _onMouseDownSlRange = (e) => this.onMouseDownSlRange(e);
    _onMouseDownSlRBtn = (e) => this.onMouseDownSlRBtn(e);
    mouseMoveFn;
    _onMouseUp = (e) => this.onMouseUp(e);

    constructor (block, charts, obDraw, obSlDraw, start, finish) {
        this.block = block;
        this.charts = charts;
        this.obDraw = obDraw;
        this.obSlDraw = obSlDraw;
        this.start = start;
        this.finish = finish;

        // init checkboxes
        const cbox = getElByClass(this.block, "tg-ui__checkboxes");
        this.charts.forEach((c,i) => {
            let el = document.createElement("label");
            el.innerHTML = _gOpt.tmpCheckBtn(c.name, c.color, i);
            cbox.appendChild(el);
            on(el, "change", this._onChangeCheck);
        });

        // init slider
        const sl = getElByClass(this.block, "tg-ui-slider");
        this.slLBl = getElByClass(sl, "tg-ui-slider__l-bl");
        this.slLBtn = getElByClass(sl, "tg-ui-slider__l-btn");
        this.slRange = getElByClass(sl, "tg-ui-slider__range");
        this.slRBtn = getElByClass(sl, "tg-ui-slider__r-btn");
        this.slRBl = getElByClass(sl, "tg-ui-slider__r-bl");
        this.widthBtn = this.slLBtn.offsetWidth;
        this.rx = obSlDraw.rx;
        this.w = obSlDraw.w;
        on(this.obDraw.canvas, "mousedown", this._onCanvasMouseDown);
        on(this.obDraw.canvas, "mousemove", this._onCanvasMouseMove);
        on(this.slLBtn, "mousedown", this._onMouseDownSlLBtn);
        on(this.slRange, "mousedown", this._onMouseDownSlRange);
        on(this.slRBtn, "mousedown", this._onMouseDownSlRBtn);
        on(document, "mouseup", this._onMouseUp);

        // set position slider
        let l = Math.floor(start * this.rx);
        let r =  Math.ceil((finish - 1) * this.rx);
        this.slLBtn.style.left = this.slLBl.style.width = l + "px";
        l += this.widthBtn;
        this.slRange.style.left = l + "px";
        this.slRange.style.width = r - l - this.widthBtn + "px";
        l += this.slRange.offsetWidth;
        this.slRBtn.style.left = l + "px";
        this.slRBl.style.width = this.w - l - this.widthBtn + "px";
    }

    drawHint () {
        this.obDraw.clearCharts();
        this.obDraw.drawCutLines();
        this.obDraw.drawCharts();
        this.obDraw.hint(this.hintPosition);
    }

    onCanvasMouseDown (e) {
        if (this.detectLeftMouse(e)) {
            this.hintPosition = Math.round(this.obDraw.start + (e.clientX - e.target.offsetLeft) / this.obDraw.rx);
            this.isMouseHint = true;
            this.drawHint();
        }
    }

    onCanvasMouseMove (e) {
        if (this.isMouseHint) {
            const np = Math.round(this.obDraw.start + (e.clientX - e.target.offsetLeft) / this.obDraw.rx);
            if (np !== this.hintPosition) {
                this.hintPosition = np;
                this.drawHint();
            }
        }
    }

    calcDrawMoveStep (e) {
        setTimeout(() => {
            this.obDraw.dateMoveStep = Math.round(
                Math.sqrt(
                    Math.abs(this.clientXOld - e.clientX) / this.timeOutOfMouseSpeed * this.rateOfMouseSpeed
                ) / 1.2
            );
            if (this.obDraw.dateMoveStep > this.obDraw.monthWidth) this.obDraw.dateMoveStep = this.obDraw.monthWidth;
            this.clientXOld = e.clientX;
        }, this.timeOutOfMouseSpeed);
    }

    onChangeCheck (e) {
        let count = 0;
        this.charts.forEach((c) => {
            if (!c.hidden) ++count;
        });

        if (count === 1 && !e.target.checked) {
            e.target.checked = true; // one chart should always be shown
        } else {
            this.charts[e.target.value].hidden = !e.target.checked;
            this.obDraw.drawAll();
            this.obSlDraw.drawOnlyCharts();
        }
    }

    onMouseDownSlLBtn (e) {
        this.removeMouse();
        if (!this.detectLeftMouse(e)) return;
        this.hintPosition = null;
        this.pos = e.clientX - e.target.offsetLeft;
        this.mouseMoveFn = (e) => this.onMouseMoveSlLBtn(e);
        on(document, "mousemove", this.mouseMoveFn);
    }

    onMouseDownSlRange (e) {
        this.removeMouse();
        if (!this.detectLeftMouse(e)) return;
        this.hintPosition = null;
        this.pos = e.clientX - this.slLBtn.offsetLeft;
        this.mouseMoveFn = (e) => this.onMouseMoveSlRange(e);
        on(document, "mousemove", this.mouseMoveFn);
    }

    onMouseDownSlRBtn (e) {
        this.removeMouse();
        if (!this.detectLeftMouse(e)) return;
        this.hintPosition = null;
        this.pos = e.clientX - e.target.offsetLeft;
        this.mouseMoveFn = (e) => this.onMouseMoveSlRBtn(e);
        on(document, "mousemove", this.mouseMoveFn);
    }

    onMouseMoveSlLBtn (e) {
        if (!this.clientXOld) this.clientXOld = e.clientX;
        let l = e.clientX - this.pos;
        if (l < 0) l = 0;
        let isToLeft = this.slLBtn.offsetLeft < l;
        let rangeWidth = this.slRBtn.offsetLeft - l;
        if (rangeWidth - this.widthBtn < this.minRangeWidth) return;

        this.slLBtn.style.left = this.slLBl.style.width = l + "px";
        this.slRange.style.left = l + this.widthBtn + "px";
        this.slRange.style.width = rangeWidth + "px";

        this.calcDrawMoveStep(e);
        const s = this.slLBtn.offsetLeft / this.rx;
        const f = (this.slRBtn.offsetLeft + this.widthBtn) / this.rx + 1;

        if (isToLeft) this.obDraw.compressAxisXtoLeft(s, f);
        else this.obDraw.stretchAxisXtoLeft(s, f);
    }

    onMouseMoveSlRange (e) {
        if (!this.clientXOld) this.clientXOld = e.clientX;
        let l = e.clientX - this.pos;
        const tmpmax = this.w - this.widthBtn*2 - this.slRange.offsetWidth;
        if (l < 0)  l = 0;
        else if (l > tmpmax) l = tmpmax;
        let isToLeft = this.slLBtn.offsetLeft > l;

        this.slLBtn.style.left = this.slLBl.style.width = l + "px";
        l += this.widthBtn;
        this.slRange.style.left = l + "px";
        l += this.slRange.offsetWidth;
        this.slRBtn.style.left = l + "px";
        this.slRBl.style.width = this.w - l - this.widthBtn + "px";

        this.calcDrawMoveStep(e);
        this.obDraw.move(
            isToLeft,
            this.slLBtn.offsetLeft / this.rx,
            (this.slRBtn.offsetLeft + this.widthBtn) / this.rx + 1
        );
    }

    onMouseMoveSlRBtn (e) {
        if (!this.clientXOld) this.clientXOld = e.clientX;
        let l = e.clientX - this.pos;
        const tmpmax = this.w - this.widthBtn;
        if (l > tmpmax) l = tmpmax;
        let isToRight = this.slRBtn.offsetLeft < l;
        let rangeWidth = l - this.slLBtn.offsetLeft - this.widthBtn;
        if (rangeWidth < this.minRangeWidth) return;

        this.slRBtn.style.left = l + "px";
        this.slRBl.style.width = this.w - l + "px";
        this.slRange.style.width = rangeWidth + "px";

        this.calcDrawMoveStep(e);
        const s = this.slLBtn.offsetLeft / this.rx;
        const f = (this.slRBtn.offsetLeft + this.widthBtn) / this.rx + 1;

        if (isToRight) this.obDraw.stretchAxisXtoRight(s, f);
        else this.obDraw.compressAxisXtoRight(s, f);
    }

    onMouseUp (e) {
        this.isMouseHint = false;
        this.removeMouse();
    }

    removeMouse () {
        this.obDraw.dateMoveStep = this.obDraw.dateMoveStepDefault;
        if (this.mouseMoveFn) off(document, "mousemove", this.mouseMoveFn);
        this.mouseMoveFn = undefined;
    }

    detectLeftMouse (e) {
        e = e || window.event;
        if ("buttons" in e) return e.buttons == 1;
        return (e.which || e.button) == 1;
    }
}