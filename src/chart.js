export default class Chart {
    name;
    color;
    values;
    hidden = false;

    constructor (name, color, values) {
        this.name = name;
        this.color = color;
        this.values = values;
    }
}