const prompt = require("prompt");
const fetch = require('node-fetch');
const fs = require('fs');
const Jimp = require("jimp");
const _ = require('lodash');
const rgbHex = require('rgb-hex');
console.log("---------------------------------------------------------------");
console.log("This will convert an image from within the folder to");
console.log("a Dr. Racket blob of code. This program is very unefficient");
console.log("because it registers every pixel.  This program also favors");
console.log("red colors, so you Dr. Racket image will more than likely not");
console.log("look at all like the original.  Also, Dr. will crash if the ");
console.log("original image is more than a couple hundred pixels by a couple");
console.log("hundred pixeld.  Input the name of the image.  It can be a .png,");
console.log("a .jpg, or jpeg.  The output will save to a file named:");
console.log("dr_racket_code.txt");
console.log("Then input a multiplier, if you want to blow up the image, and");
console.log("make it much larger.");
console.log("----------------------------------------------------------------");
prompt.message = "Image Converter";
let h = "";
let w = "";
let re = /<tr><td><span style="background-color: #([a-f0-9]{6})"><span class="hspace">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<\/span><\/span><span class="hspace">&nbsp;<\/span>(\w+)<\/td><\/tr>/g;

prompt.start();
prompt.get(['image_Name', 'multiplier'], function (err, result) {
	function getColors() {
		return new Promise((f, r)=> {
			fetch('https://docs.racket-lang.org/draw/color-database___.html').then(d => d.text()).then(b => {
				let dataArr = b.match(re);
				let a = [];
				while(m = re.exec(dataArr)) { a.push({ hex:m[1], dec: parseInt(m[1], 16), name:m[2] }) }
				f(a);
			});
		})
	}

	let allColors = [];
	function readImage() {
		return new Promise((f, r)=> {
			Jimp.read(result.image_Name, function (err, image) {
				h = image.bitmap.height;
				w = image.bitmap.width;
				console.log("Heigth: " + h + "\tWidth: " + w);
				console.log("Processing... this could take a while.");
					// do stuff with the image (if no exception)
					//console.log(image.bitmap.height);
				image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
					// x, y is the position of this pixel on the image
					// idx is the position start position of this rgba tuple in the bitmap Buffer
					// this is the image
					//process.stdout.write(".");
					var red   = this.bitmap.data[ idx + 0 ];
					var green = this.bitmap.data[ idx + 1 ];
					var blue  = this.bitmap.data[ idx + 2 ];
					var alpha = this.bitmap.data[ idx + 3 ];
					
					
					
					//let obj = {'r':red, 'g':green, 'b':blue};
					let pushed = allColors.push({'hex': rgbHex(red, green, blue), 'dec': parseInt(rgbHex(red, green, blue), 16), 'x':x, 'y':y});
					//let pushed = allColors.push({'dec': parseInt(rgbHex(red, green, blue), 16), 'x':x, 'y':y});
					if(err) reject(err);
					else { f(pushed); }
					//console.log("\"" + red + "," + green + "," + blue + "\"");
					// rgba values run from 0 - 255
					// e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
					//console.log(image.getPixelColor(x, y));
				});
			});
		});
	}


	getColors().then(colorList => {
		readImage().then(() => {
			let m = result.multiplier;
			function closest (ele) {
				let mid;
				let lo = 0;
				let hi = colorList.length - 1;
				while(hi - lo > 1) {
					mid = Math.floor((lo + hi) / 2);
					if(colorList[mid].dec < ele.dec) lo = mid;
					else hi = mid;
				}
				if(ele.dec - colorList[lo].dec <= colorList[hi].dec - ele.dec) {
					return "(draw-solid-rect (make-posn " + parseInt(ele.x) * m + " " + parseInt(ele.y) * m + ") " + m + " " + m + " `" + colorList[lo].name + ")";
				}
				else return "(draw-solid-rect (make-posn " + parseInt(ele.x) * m + " " + parseInt(ele.y) * m + ") " + m + " " + m + " `" + colorList[hi].name + ")";
			}
			
			function closest2(ele) {
				let i = 0;
				let cur = {'name':colorList[0].name, 'hex':colorList[0].hex};
				let str = "(draw-solid-rect (make-posn " + parseInt(ele.x) * m + " " + parseInt(ele.y) * m + ") " + m + " " + m + " `";
				let loc = ""
				while(i < colorList.length - 1) {
					if(colorList[i].hex === ele.hex) {
						cur = {'name': colorList[i].name, 'hex':colorList[i].hex};
						loc = i;
						break;
					}
					else if(Math.abs(parseInt(ele.hex.substr(0,2), 16) - parseInt(colorList[i].hex.substr(0,2), 16)) < Math.abs(parseInt(ele.hex.substr(0,2), 16) - parseInt(cur.hex.substr(0, 2), 16))) {
						if(Math.abs(parseInt(ele.hex.substr(2,4), 16) - parseInt(colorList[i].hex.substr(2,4), 16)) < Math.abs(parseInt(ele.hex.substr(2,4), 16) - parseInt(cur.hex.substr(2, 4), 16))) {
							if(Math.abs(parseInt(ele.hex.substr(4,6), 16) - parseInt(colorList[i].hex.substr(4,6), 16)) < Math.abs(parseInt(ele.hex.substr(4,6), 16) - parseInt(cur.hex.substr(4, 6), 16))) {
								cur = {'name': colorList[i].name, 'hex':colorList[i].hex};
								loc = i;
							}
							else {
								
							}
						}
						else {
							
						}
					}
					else if(Math.abs(ele.dec - colorList[i].dec) < Math.abs(ele.dec - cur)) {
						cur = {'name': colorList[i].name, 'hex':colorList[i].hex};
						loc = i;
					}
					++i;
				}
				//console.log("Color picked: " + cur.name + ",\t\tAt: " + i + ",\tHex: " + cur.hex);
				return str + cur.name + ")";
			}
			
			
			function format(e) {
				return e;
			}
			
			let colorsOnly = _.uniqWith(allColors, _.isEqual);
			out = "(start " + w*m + " " + h*m + ")\n" + allColors.map(closest2).map(format).join('\n')
			fs.writeFile('dr_racket_code.txt', out, (err)=> {
				if(err) throw err;
				console.log("The File has been saved");
				console.log("Multiplier: " + m);
				console.log("New Heigth: " + h + "\tNew Width: " + w);
			})
		
		})
	})
});



