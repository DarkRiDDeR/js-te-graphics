import {_gOpt} from "./app";

export default class Draw {
    canvas;
    ctx;
    x;
    charts;
    start;
    finish;
    xIndent = 10;
    bottomXIndent = 12;
    indent = 8;
    bottomIndent = 25;
    monthWidth;
    speedChartChanging = 0.15;
    timerDrawId;
    dateMoveStep = 3;
    dateMoveStepDefault = 3;
    thickness =_gOpt.thickness;
    w;
    h;
    min;
    max;
    rx;
    ry;
    axisX; // array [text, x, y]
    isAxisMoving = false;

    constructor (canvas, x, charts, start, finish) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.w = canvas.width;
        this.h = canvas.height;
        this.x = x;
        this.charts = charts;
        this.start = start;
        this.finish = finish;
        this.dateClearY = this.h - this.bottomXIndent - _gOpt.fontSize;
        this.dateClearH = _gOpt.fontSize + 5;
    }

    smoothY (start, finish, callback) {
        let ry;
        [this.rx, ry] = this.calculateParams(start, finish);
        if (typeof this.ry === "undefined") this.ry = ry;
        const step = (ry - this.ry) * this.speedChartChanging;

        clearTimeout(this.timerDrawId);
        const tick = () => {
            if (step > 0 ? this.ry < ry : this.ry > ry) {
                callback();
                this.timerDrawId = setTimeout(tick, 25); // recursion
                this.ry += step;
            } else {
                this.ry = ry;
                callback();
            }
        };
        tick();
    }

    drawAll (start, finish) {
        this.smoothY(start, finish, () => {
            this.bgColor();
            this.drawCutLines();
            this.drawAxisX();
            this.drawCharts();
        });
    }

    drawOnlyCharts (start, finish) {
        this.smoothY(start, finish, () => {
            this.bgColor();
            this.drawCharts();
        });
    }

    bgColor () {
        this.ctx.fillStyle = _gOpt.bgColor;
        this.ctx.fillRect(0,0,this.w,this.h);
    }

    /**
     * calculate start, finish, min, max, rx, ry
     * @param start
     * @param finish
     */
    calculateParams (start, finish) {
        if (typeof start !== "undefined") this.start = start;
        if (typeof finish !== "undefined") this.finish = finish;
        start = this.start;
        finish = this.finish;

        // min and max y
        this.min = 0; // Number.MAX_VALUE;
        this.max = 1; // 0

        const minMax = (v) => {
            if (v < this.min) this.min = v;
            if (v > this.max) this.max = v;
        };

        this.charts.forEach((c) => {
            if (c.hidden) return;

            // fractional part of the number
            if (start % 1 > 0) {
                let pos = Math.trunc(start);
                minMax(this.getYOfLine([pos, c.values[pos]], [++pos, c.values[pos]], start));
                start = pos;
            }
            if (finish % 1 > 0) {
                let pos = Math.trunc(finish) - 1;
                minMax(this.getYOfLine([pos, c.values[pos]], [++pos, c.values[pos]], finish-1));
                finish = pos;
            }

            for (let i = start; i < finish; i++) {
                minMax(c.values[i]);
            }
        });
        //this.rx = this.w / (this.finish - this.start - 1);
        //this.ry = (this.h-this.bottomIndent-this.indent*2)/(this.max - this.min);
        return [this.w / (this.finish - this.start - 1), (this.h-this.bottomIndent-this.indent*2)/(this.max - this.min)];
    }

    drawCutLines () {
        const ctx = this.ctx;
        const nd = Math.pow(10,  this.numOfDigits(this.max) - 1);

        // density of cut lines
        let rnd = this.h * (this.max - this.min) / nd;
        let div;
        if (rnd < 500) div = 5;
        else if (rnd < 1100) div = 2.5;
        else if (rnd < 1500) div = 2;
        else /*if (rnd < 2600)*/ div = 1;
        //else div = 0.65;

        // cut lines
        ctx.fillStyle = _gOpt.fontColor;
        ctx.strokeStyle = _gOpt.cutLineColor;
        ctx.lineWidth = _gOpt.cutLineThickness;
        let step = Math.trunc(nd / div);
        if (step < 1) step = 1;
        const rstep = step * this.ry;
        let y = this.h - this.bottomIndent - this.indent;
        ctx.beginPath();
        let max = this.max - (_gOpt.fontSize + 2) / this.ry;
        for (let i = 0; i < max; i += step) {
            ctx.fillText(i, 0, y - 8);
            ctx.moveTo(0, y);
            ctx.lineTo(this.w, y);
            y -= rstep;
        }
        ctx.stroke();
    }

    getAxisX (recountStep = true) {
        let axisX = [];
        let x = this.x.slice(this.start, this.finish);
        const rx = this.w / (x.length - 1);
        const monthTextWidth = this.ctx.measureText("Mar 25").width;
        let w = this.w - this.xIndent*2 - monthTextWidth;
        const dateStep = Math.ceil(monthTextWidth / rx) * 2;
        let count = w / dateStep / rx;
        const shift = count % 1 * rx;
        count = Math.trunc(count);

        if (recountStep) {
            this.stepOfAxisX = (w - shift) / count;  // for intervals between months
            this.monthWidth = this.stepOfAxisX / 2;
        }

        let iP = this.xIndent + shift/2;
        let iD = Math.round((iP + this.stepOfAxisX / 2) / rx);
        const y = this.h - this.bottomXIndent;
        for (let i = 0; i <= count; i++) {
            axisX.push([x[iD][0], iP, y]);
            iP += this.stepOfAxisX;
            iD += dateStep;
        }

        return axisX;
    }

    clearAxisX () {
        this.ctx.fillStyle = _gOpt.bgColor;
        this.ctx.fillRect(0, this.dateClearY, this.w, this.dateClearH);
    }

    clearCharts () {
        this.ctx.fillStyle = _gOpt.bgColor;
        this.ctx.fillRect(0,0,this.w,this.axisX[0][2] - _gOpt.fontSize);
    }

    drawAxisX () {
        this.axisX = this.getAxisX();
        this.ctx.fillStyle = _gOpt.fontColor;
        this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
    }

    move (toLeft = true, start, finish) {
        this.smoothY(start, finish, () => {
            this.clearCharts();
            this.drawCutLines();
            this.drawCharts();
        });

        if (this.isAxisMoving) return;
        toLeft ? this.moveToLeft(start, finish) : this.moveToRight(start, finish);
    }

    moveToLeft (start, finish) {
        const newAxisX = this.getAxisX(false); // new
        let axis = this.axisX; // old
        if (axis[0][0] === newAxisX[0][0]) return;

        this.isAxisMoving = true;
        this.axisX = newAxisX; // new
        axis.unshift([...newAxisX[0]]);
        const max = this.monthWidth * 2;
        axis[0][1] -= max;

        let i = 0;
        const tick = () => {
            this.clearAxisX();
            this.ctx.fillStyle = _gOpt.fontColor;

            if (i < max) {
                axis.forEach((e) => this.ctx.fillText(e[0], e[1] + i, e[2]));
                setTimeout(tick, 15); // recursion
            } else {
                this.isAxisMoving = false;
                this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
            }
            i += this.dateMoveStep;
        };
        tick();
    }

    moveToRight (start, finish) {
        const newAxisX = this.getAxisX(false); // new
        let axis = this.axisX; // old
        const lastI = axis.length - 1;
        const lastNewI = newAxisX.length - 1;
        if (axis[lastI][0] === newAxisX[lastNewI][0]) return;

        this.isAxisMoving = true;
        this.axisX = newAxisX; // new
        axis.push([...newAxisX[lastNewI]]);
        const max = this.monthWidth * 2;
        axis[lastI+1][1] += max;

        let i = 0;
        const tick = () => {
            this.clearAxisX();
            this.ctx.fillStyle = _gOpt.fontColor;

            if (i < max) {
                axis.forEach((e) => this.ctx.fillText(e[0], e[1] - i, e[2]));
                setTimeout(tick, 15); // recursion
            } else {
                this.isAxisMoving = false;
                this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
            }
            i += this.dateMoveStep;
        };
        tick();
    }

    stretchAxisXtoLeft (start, finish) {
        this.smoothY(start, finish, () => {
            this.clearCharts();
            this.drawCutLines();
            this.drawCharts();
        });

        if (this.isAxisMoving) return;

        const max = this.monthWidth * 2;
        const newAxisX = this.getAxisX(); // new
        let axis = this.axisX; // old
        if (axis[0][0] === newAxisX[0][0]) return;

        this.isAxisMoving = true;
        this.axisX = newAxisX; // new

        for (let ir = newAxisX.length - 1; ir >= 0; ir--) {
            axis.unshift([...newAxisX[ir]]);
            axis[0][1] = axis[1][1] - max;
        }

        const isEven = axis.length % 2; // even number of axis length
        let i = 0;
        let opacity = 255;

        const opacityStep = 144 / this.dateMoveStep;
        const tick = () => {
            this.clearAxisX();
            this.ctx.fillStyle = _gOpt.fontColor;

            if (i < max) {
                let opacity16 = Math.trunc(opacity).toString(16);
                if (opacity16.length < 2) opacity16 = "0" + opacity16;

                axis.forEach((e, i2) => {
                    if (i2 % 2 == isEven) this.ctx.fillStyle += opacity16;
                    else this.ctx.fillStyle = _gOpt.fontColor;

                    const shift = i * Math.round((axis.length - i2 - 1) / 2);
                    this.ctx.fillText(e[0], e[1] + shift, e[2]);
                });
                setTimeout(tick, 15); // recursion
            } else {
                this.isAxisMoving = false;
                this.axisX = this.getAxisX(); // new
                this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
            }
            i += 3 + Math.sqrt(this.dateMoveStep)/4;
            if (opacity > 0) opacity -= opacityStep;
            else opacity = 0;
        };
        tick();
    }

    stretchAxisXtoRight (start, finish) {
        this.smoothY(start, finish, () => {
            this.clearCharts();
            this.drawCutLines();
            this.drawCharts();
        });

        if (this.isAxisMoving) return;

        const max = this.monthWidth * 2;
        const newAxisX = this.getAxisX(); // new
        let axis = this.axisX; // old
        if (axis[axis.length - 1][0] === newAxisX[newAxisX.length -1][0]) return;

        this.isAxisMoving = true;
        this.axisX = newAxisX; // new

        for (let i = 0; i < newAxisX.length; i++) {
            axis.push([...newAxisX[i]]);
            axis[axis.length-1][1] = axis[axis.length-2][1] + max;
        }

        let i = 0;
        let opacity = 255;

        const opacityStep = 144 / this.dateMoveStep;
        const tick = () => {
            this.clearAxisX();
            this.ctx.fillStyle = _gOpt.fontColor;

            if (i < max) {
                let opacity16 = Math.trunc(opacity).toString(16);
                if (opacity16.length < 2) opacity16 = "0" + opacity16;

                axis.forEach((e, i2) => {
                    if (i2 % 2) this.ctx.fillStyle += opacity16;
                    else this.ctx.fillStyle = _gOpt.fontColor;

                    const shift = i * Math.round(i2 / 2);
                    this.ctx.fillText(e[0], e[1] - shift, e[2]);
                });
                setTimeout(tick, 15); // recursion
            } else {
                this.isAxisMoving = false;
                this.axisX = this.getAxisX(); // new
                this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
            }
            i += 3 + Math.sqrt(this.dateMoveStep)/4;
            if (opacity > 0) opacity -= opacityStep;
            else opacity = 0;
        };
        tick();
    }

    compressAxisXtoLeft (start, finish) {
        this.smoothY(start, finish, () => {
            this.clearCharts();
            this.drawCutLines();
            this.drawCharts();
        });

        if (this.isAxisMoving) return;

        const max = this.monthWidth;
        const newAxisX = this.getAxisX(); // new
        let axis = this.axisX; // old
        if (axis[0][0] === newAxisX[0][0]) return;

        this.isAxisMoving = true;
        this.axisX = newAxisX; // new

        for (let ir = axis.length-1, ir2 = newAxisX.length-1; ir > 1 && ir2 >= 0; ir--, ir2--) {
            axis.splice(ir, 0, [...newAxisX[ir2]]);
            axis[ir][1] = axis[ir-1][1] + this.monthWidth;
        }

        const isEven = axis.length % 2; // even number of axis length
        let i = max;
        let opacity = 0;

        const opacityStep = 255 / this.dateMoveStep;
        const tick = () => {
            this.clearAxisX();
            this.ctx.fillStyle = _gOpt.fontColor;

            if (i > 0) {
                let opacity16 = Math.trunc(opacity).toString(16);
                if (opacity16.length < 2) opacity16 = "0" + opacity16;

                axis.forEach((e, i2) => {
                    if (i2 % 2 !== isEven) this.ctx.fillStyle += opacity16;
                    else this.ctx.fillStyle = _gOpt.fontColor;

                    const shift = (i - max-1) * (axis.length - i2 - 1);
                    this.ctx.fillText(e[0], e[1] + shift, e[2]);
                });
                setTimeout(tick, 10); // recursion
            } else {
                this.isAxisMoving = false;
                this.axisX = this.getAxisX(); // new
                this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
            }
            i -= 1 + Math.sqrt(this.dateMoveStep)/4;
            if (opacity < 255) opacity += opacityStep;
            else opacity = 255;
        };
        tick();
    }

    compressAxisXtoRight (start, finish) {
        this.smoothY(start, finish, () => {
            this.clearCharts();
            this.drawCutLines();
            this.drawCharts();
        });

        if (this.isAxisMoving) return;

        const max = this.monthWidth;
        const newAxisX = this.getAxisX(); // new
        let axis = this.axisX; // old
        if (axis[axis.length - 1][0] === newAxisX[newAxisX.length - 1][0]) return;

        this.isAxisMoving = true;
        this.axisX = newAxisX; // new

        for (let i = 1, i2 = 0; i < axis.length && i2 < newAxisX.length; i+=2, i2++) {
            axis.splice(i, 0, [...newAxisX[i2]]);
            axis[i][1] = axis[i-1][1] + this.monthWidth;
        }

        const isEven = axis.length % 2; // even number of axis length
        let i = 0;
        let opacity = 0;

        const opacityStep = 255 / this.dateMoveStep;
        const tick = () => {
            this.clearAxisX();
            this.ctx.fillStyle = _gOpt.fontColor;

            if (i < max) {
                let opacity16 = Math.trunc(opacity).toString(16);
                if (opacity16.length < 2) opacity16 = "0" + opacity16;

                axis.forEach((e, i2) => {
                    if (i2 % 2) this.ctx.fillStyle += opacity16;
                    else this.ctx.fillStyle = _gOpt.fontColor;

                    const shift = i * i2;
                    this.ctx.fillText(e[0], e[1] + shift, e[2]);
                });
                setTimeout(tick, 10); // recursion
            } else {
                this.isAxisMoving = false;
                this.axisX = this.getAxisX(); // new
                this.axisX.forEach((e) => this.ctx.fillText(e[0], e[1], e[2]));
            }
            i += 1 + Math.sqrt(this.dateMoveStep)/4;
            if (opacity < 255) opacity += opacityStep;
            else opacity = 255;
        };
        tick();
    }

    drawCharts () {
        const ctx = this.ctx;
        ctx.lineWidth = this.thickness;
        let h2 = this.h - this.bottomIndent-this.indent;
        let start = this.start;
        let finish = this.finish;
        const shift = (1 - start % 1) * this.rx;
        start = Math.floor(start);
        if (finish < this.x.length) finish++;

        this.charts.forEach((c) => {
            if (c.hidden) return;
            ctx.strokeStyle = c.color;
            ctx.beginPath();
            let x = 0;
            if (shift > 0) x = -1;
            ctx.moveTo(shift + x * this.rx, h2-(c.values[start]-this.min)*this.ry);
            x++;
            for (let i = start+1; i < finish; i++, x++) {
                ctx.lineTo(shift + x*this.rx, h2-(c.values[i]-this.min)*this.ry);
            }
            ctx.stroke();
        });
    }

    /**
     *
     * @param c1 - coord [x,y]
     * @param c2 - coord [x,y]
     */
    getYOfLine (c1, c2, x) {
        return (c2[1] - c1[1]) / (c2[0] - c1[0]) * (x - c1[0]) + c1[1]; // equation of a line
    }

    hint (n) {
        const ctx = this.ctx;
        const shift = (1 - this.start % 1) * this.rx;
        const font = _gOpt.fontSize + "px " + _gOpt.font;
        const fontSHeader = _gOpt.fontSize + 1; // font size
        const fontHeader = fontSHeader + "px " + _gOpt.font;
        const fontSVal = fontSHeader + 2;
        const fontVal = fontSVal + "px " + _gOpt.font;
        const lineSp1 = 15; // line spacing
        const lineSp2 = 5;
        const intervalBetween = 20; // interval between values
        let arWT = []; // array of text width [width of val, width of name]

        ctx.font = font;
        let x = (n - this.start) * this.rx;
        let y = this.h-this.bottomIndent - this.indent;

        // line
        ctx.strokeStyle = _gOpt.cutLineColor;
        ctx.lineWidth = _gOpt.hintThickness;
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, y);
        ctx.stroke();

        // circles
        ctx.fillStyle = _gOpt.bgColor;
        ctx.lineWidth = _gOpt.thickness;
        let wL1 = 0;
        let wL2 = 0;
        this.charts.forEach((c, i) => {
            if (c.hidden) return;
            ctx.font = fontHeader;
            arWT[i] = [];
            arWT[i][0] = ctx.measureText(c.values[n]).width;
            wL1 += arWT[i][0] + intervalBetween;
            ctx.font = font;
            arWT[i][1] = ctx.measureText(c.name).width;
            wL2 += arWT[i][1] + intervalBetween;
            ctx.strokeStyle = c.color;
            ctx.beginPath();
            ctx.arc(
                x,
                y - c.values[n] * this.ry,
                _gOpt.cutLineThickness+_gOpt.hintRadius,
                0,
                2 * Math.PI
            );
            ctx.fill();
            ctx.stroke();
        });
        wL1 -= intervalBetween;
        wL2 -= intervalBetween;

        // rectangle
        ctx.font = fontHeader;
        let text = this.x[n][1] + ", " + this.x[n][0];
        let wL0 = ctx.measureText(text).width;
        const width = Math.max( wL0, wL1, wL2) + _gOpt.hintPadding * 2;
        const height = _gOpt.fontSize + fontSHeader + fontSVal + _gOpt.hintPadding * 2 + lineSp1 + lineSp2;
        x -= width / 2;
        y = 10;
        ctx.strokeStyle = _gOpt.hintBorderColor;
        ctx.lineWidth = _gOpt.hintThickness;
        ctx.fillStyle = _gOpt.hintBgColor;
        this.roundRect(x, y, width, height, _gOpt.hintBorderRadius,);
        this.roundRect(x+1, y+1, width-2, height-2, _gOpt.hintBorderRadius, true);

        // shift
        let shiftHeader = 0;
        let shiftVal = 0;
        const wL12 = Math.max(wL1, wL2);
        if (wL0 < wL12) shiftHeader = (wL12 - wL0) / 2;
        else shiftVal = (wL0 - wL12) / 2;

        // text
        ctx.fillStyle = _gOpt.hintHeaderColor;
        ctx.strokeStyle = _gOpt.cutLineColor;
        ctx.lineWidth = _gOpt.cutLineThickness;
        x += _gOpt.hintPadding;
        y += _gOpt.hintPadding + fontSHeader;
        ctx.fillText(text, x + shiftHeader, y);

        ctx.font = _gOpt.fontSize + "px " + _gOpt.font;
        y += lineSp1 + fontSVal;
        x += shiftVal;
        this.charts.forEach((c, i) => {
            if (c.hidden) return;
            ctx.fillStyle = c.color;
            let w, shiftVal = 0, shiftName = 0;
            if (arWT[i][0] > arWT[i][1]) {
                w = arWT[i][0];
                shiftName = (arWT[i][0] - arWT[i][1]) / 2 - 1;
            } else {
                w = arWT[i][1];
                shiftVal = (arWT[i][1] - arWT[i][0]) / 2 - 1;
            }
            ctx.font = fontVal;
            ctx.fillText(c.values[n], x + shiftVal, y);
            ctx.font = font;
            ctx.fillText(c.name, x + shiftName, y + _gOpt.fontSize + lineSp2);
            x += w + intervalBetween;
        });
    }

    /**
     * Draws a rounded rectangle using the current state of the canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate
     * @param {Number} width The width of the rectangle
     * @param {Number} height The height of the rectangle
     * @param {Number} radius The corner radius. Defaults to 5;
     * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
     * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
     */
    roundRect(x, y, width, height, radius, fill, stroke) {
        const ctx = this.ctx;
        if (typeof stroke == "undefined" ) stroke = true;
        if (typeof radius === "undefined") radius = 5;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (stroke) ctx.stroke();
        if (fill) ctx.fill();
    }

    numOfDigits (n) {
        let i = 0;
        while(n > 0) {
            n = Math.trunc(n / 10);
            ++i;
        }
        return i;
    }
}