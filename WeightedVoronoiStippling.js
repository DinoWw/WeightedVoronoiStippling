//import quadtree
//import {QuadTree, Box, Point, Circle} from 'js-quadtree';

//configuraitons
const generatorN = 3000;
const doShadeIn = false;
const displayCentroids = false;
const displayImage = false;
const generatorInfluenceRange = 0.02;
const resolutionFactor = 2;							//how much larger will the pixel resolution on which the calculations are done be than the image resolution; unimplemented
const whiteCutoff = .1 									//every pixel with brigntess below this value will be considered white

//initialize the quadtree
const boundingArea = new QT.Box(0, 0, 1, 1);
const config = {
    capacity: 4,            // Specify the maximum amount of points per node (default: 4)
    removeEmptyNodes: true,  // Specify if the quadtree has to remove subnodes if they are empty (default: false).
    maximumDepth: -1,         // Specify the maximum depth of the quadtree. -1 for no limit (default: -1).
    // Specify a custom method to compare point for removal (default: (point1, point2) => point1.x === point2.x && point1.y === point2.y). (not using currently)
    // arePointsEqual: (point1, point2) => point1.data.foo === point2.data.foo      
};
const generatorQuadtree = new QT.QuadTree(boundingArea, config);

//load the image that defines the denisty function
const imageArray = ["sphere.jpg","sphere-100x100.jpg","gradient.png","gradient-100x100.png","gradient-300x300.png", "corn.png", "corn-100x100.png"];
let img;
let density;
function preload() {
  img = loadImage(`images/${imageArray[0]}`);

}

function setup(){
	createCanvas(600, 600);

	//generate generators with normalized coordinates
	for(let i = 0; i < generatorN; i ++){
		generatorQuadtree.insert({'x': random(), 'y': random(), 'color': random(255), 'xSum': 0, 'ySum': 0, 'xN': 0, 'yN': 0});
	}

	//image doesn't change so loading the pixels every frame is not neccesary
	img.loadPixels();
	//define the deinsty function
  density = generateDensityFunction(img.pixels, whiteCutoff);

	noFill();
	noStroke();
	//frameRate(1);

}



function draw(){

	//reset centroids
	const generators = generatorQuadtree.getAllPoints();
	for(const generator of generators){
		generator.xSum = 0;
		generator.ySum = 0;
		generator.xN = 0;
		generator.yN = 0;
	}

	if(doShadeIn){
		//load pixels array for displaying voronoi regoins
		loadPixels();
	}else{
		if(displayImage){
			image(img, 0, 0);
		}
		else{
			background(255);
		}
	}

	console.time("Frame time");
	for (let i = 0; i < img.width*img.height; i += float(1)/resolutionFactor) {

		//find normalized coordinates
		let xPixel = int(i%(img.width))/(img.width);
		let yPixel = int(i/(img.width))/(img.width);


		//find closest generator
		let closestGenerator;
		let dMin = 2;
		const closeGenerators = generatorQuadtree.query(new QT.Circle(xPixel, yPixel, generatorInfluenceRange));
		for(let j = 0; j < closeGenerators.length; j ++){
			const generator = closeGenerators[j];
			let d = dist(generator.x, generator.y, xPixel, yPixel);
			if(d < dMin){
				dMin = d;
				closestGenerator = generator;
			}
		}

		//skip if there are no generators in range
		//still converges normally **most of the time** so no problem there, but allows for lower generatorInfluenceRange, meaning higher performance
		//should ideally redo the check with a larger radius
		if(closestGenerator == undefined){
			continue;
		}

		if(doShadeIn){
			//set color of pixel to color of closest generator
		  pixels[i] = closestGenerator.color;
		  pixels[i + 1] = closestGenerator.color;
		  pixels[i + 2] = closestGenerator.color;
		  pixels[i + 3] = 255;
		}

		let ro = density(int(i));
	  closestGenerator.xSum += xPixel*ro;
	  closestGenerator.ySum += yPixel*ro;
	  closestGenerator.xN += ro;
	  closestGenerator.yN += ro;


	}

	if(doShadeIn){
		//update pixels lol
		updatePixels();
	}	

	console.timeEnd("Frame time");



	//calculate controids
	for(const generator of generators){
		let centroidX, centroidY;

		if(generator.xN == 0){
			centroidX = generator.x;
		}
		else{
			centroidX = generator.xSum/generator.xN;
		}

		if(generator.yN == 0){
			centroidY = generator.y;
		}
		else{
			centroidY = generator.ySum/generator.yN;
		}

		generator.centroid = {'x': centroidX, 'y': centroidY};
	}

	for(const generator of generators){
		//display generators and their centroids
		fill(0, 150, 255);
		circle(generator.x*width, generator.y*height, width*.007);
		if(displayCentroids){
			fill(255);
			circle(generator.centroid.x*width, generator.centroid.y*height, width*.002);
		}	

		//iterate
		generator.x = generator.centroid.x;
		generator.y = generator.centroid.y;
	}

	//update quadtree
	generatorQuadtree.clear();
	generatorQuadtree.insert(generators)

	console.log(frameCount);


}


