function generateDensityFunction(img, lowerCutoff){
	return (index) =>
		1 - max(brightness(color(img[4*index], img[4*index+1], img[4*index+2]))/100 - lowerCutoff, 0);
	
}