"use strict";

import "./scss/style.scss";

import {getElByClass} from "./dom";
import Chart from "./chart";
import Draw from "./draw";
import UI from "./ui";

export let _gOpt = {
    bgColor: "#FFF",
    font: "'Roboto', sans-serif",
    fontSize: 13,
    fontColor: "#96a2aa",
    thickness: 2, // px

    cutLineColor: "#f2f4f5",
    cutLineThickness: 1,

    hintThickness: 2,
    hintBgColor: "#FFF",
    hintBorderColor: "#f2f4f5",
    hintHeaderColor: "#000",
    hintRadius: 4,
    hintBorderRadius: 7,
    hintPadding: 10,

    // will be wrapped in a label tag
    tmpCheckBtn: function (name, color, i) {
        return '<input name="tg-'+i+'" value="'+i+'" type="checkbox" checked>'
                + '<div class="tg-ui__check-mark" style="background-color: ' + color + '"></div>'
                + name;
    }
};


export default class TeGraphics {
    obDraw;
    obSlDraw;
    obUI;
    _charts = [];
    _x = [];

    constructor (block, data, options, start, finish) {
        const canvas = getElByClass(block, "tg__canvas");
        const sliderCanvas = getElByClass(block, "tg-ui-slider__canvas");
        this.options = options;
        canvas.getContext("2d").font = _gOpt.fontSize + "px " + _gOpt.font;

        // parse
        data.columns.forEach((val) => {
            let k = val.shift();
            let t = data.types[k];

            if (t === "x") {
                val.forEach((e, i) => {
                    const d = new Date(val[i]);
                    val[i] = [this.unixDateToStr(d), this.dayNumToStr(d)];
                });
                this._x = val;
            } else if (t === "line") {
                this._charts.push(new Chart(data.names[k], data.colors[k], val));
            }
        });

        if (!start) start = 0;
        finish = finish ? (finish + 1) : this._x.length;

        this.obDraw = new Draw(canvas, this._x, this._charts, start, finish);
        this.obDraw.drawAll();

        this.obSlDraw = new Draw(sliderCanvas, this._x, this._charts, 0, this._x.length);
        this.obSlDraw.bottomIndent = 0;
        this.obSlDraw.thickness = 1;
        this.obSlDraw.drawOnlyCharts();

        this.obUI = new UI(block, this._charts, this.obDraw, this.obSlDraw, start, finish);
        this.obUI.minRangeWidth = sliderCanvas.height;
    }

    get charts () {
        return this._charts;
    }

    get x () {
        return this._x;
    }

    get options () {
        return _gOpt;
    }

    set options (v) {
        if (typeof v === "object") Object.assign(_gOpt, v);
    }

    addChart(name, color, values) {
        this._charts.push(new Chart(name, color, values));
        this.obDraw.drawAll();
        this.obSlDraw.drawOnlyCharts();
    }

    hideChart(n) {
        this._charts[n].hidden = true;
        this.obDraw.drawAll();
        this.obSlDraw.drawOnlyCharts();
    }

    showChart(n) {
        this._charts[n].hidden = false;
        this.obDraw.drawAll();
        this.obSlDraw.drawOnlyCharts();
    }

    unixDateToStr (d) {
        let m = "";

        switch (d.getMonth()) {
        case 0:
            m = "Jan";
            break;
        case 1:
            m = "Feb";
            break;
        case 2:
            m = "Mar";
            break;
        case 3:
            m = "Apr";
            break;
        case 4:
            m = "May";
            break;
        case 5:
            m = "Jun";
            break;
        case 6:
            m = "Jul";
            break;
        case 7:
            m = "Aug";
            break;
        case 8:
            m = "Sept";
            break;
        case 9:
            m = "Oct";
            break;
        case 10:
            m = "Nov";
            break;
        case 11:
            m = "Dec";
        }
        return  m + " " + d.getDate();
    }

    dayNumToStr (d) {
        switch (d.getDay()) {
        case 0:
            return "Sun";
        case 1:
            return "Mon";
        case 2:
            return "Tue";
        case 3:
            return "Wed";
        case 4:
            return "Thu";
        case 5:
            return "Fri";
        default:
            return "Sat";
        }
    }
}

global.TeGraphics = TeGraphics;
