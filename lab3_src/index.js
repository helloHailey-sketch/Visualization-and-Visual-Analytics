import { select,json, geoPath, geoMercator, zoom, scaleOrdinal, schemeBlues,scaleSequential,interpolateBlues, viewof, geoCentroid, scaleSqrt, max } from 'd3';
import { feature } from 'topojson';

//background
const svg = select('svg');

const projection = geoMercator().scale(500).center([105,34]);
const pathGenerator = geoPath().projection(projection);

const g = svg.append('g');

//panning & zooming
svg.call(zoom().on('zoom', () => {
  g.attr('transform',d3.event.transform);
}));

const rowById = {};

var resultData = new Array();

function dataProcess(year){
resultData = [];
json('chinaMap.json')
  .then(data => {
  for (let dataFeatures of data.features){
    var newProducts = '';
    let value = 0;
  
    for (let dataProducts of dataFeatures.products){
      if (dataProducts.time <= year || dataProducts.time == "未知"){
        value +=1;
        newProducts += dataProducts.name +'('+ dataProducts.time +')'+ ' '}}
                                      
    resultData.push({"id": dataFeatures.properties.id, 
                 "value": value,
                 "newProducts": newProducts});
      }
      dataIntegrate()
  });
};

function dataIntegrate(){
  
  console.log(resultData[0]);
  //for ( let results of resultData){
   // console.log(results)};
  
  //为什么完全没有反应TT
  resultData.forEach(d => {
    //console.log(d);
    rowById[d.id] = d });
};

function drawChoropleth(year){

svg.selectAll('g').remove();
const g = svg.append('g');

//panning & zooming
svg.call(zoom().on('zoom', () => {
  g.attr('transform',d3.event.transform);
}));
  
const colorScale = d3.scaleThreshold()
       .domain([0,10,20,30,40,50,60,70])
       .range(schemeBlues[8]);

json('chinaMap.json')
  .then(data => {
  
  // 这是干嘛的（
const turnNum = function(nums){
	return nums.map(Number);
}

  
  g.selectAll('paths')
     .data(data.features)
     .enter().append('path')
     .attr('d', pathGenerator)
     .attr('fill', d => colorScale(Number(rowById[d.properties.id].value)))
     .append('title')
     .text(d => d.properties.name + ': ' + rowById[d.properties.id].value + '\n' + rowById[d.properties.id].newProducts)
  
  //color legend
  const colorLegendG = svg.append('g').attr('transform', `translate(10,15)`)
   console.log('enter colorLegend');
const groups = colorLegendG.selectAll('g')
    .data(colorScale.domain());
  const groupsEnter = groups
    .enter().append('g')
  groupsEnter
    .merge(groups)
    .attr('transform', (d ,i) =>
          `translate(40,${i * 25 +170})`
          // `translate(0,${i * spacing})`
          );
  groups.exit().remove();
  
  groupsEnter.append('circle')
    .merge(groups.select('circle'))
    .attr('r', 10)
    .attr('fill', colorScale);
  //.attr('r', circleRadius)
  
  groupsEnter.append('text')
    .merge(groups.select('text'))
    .text(d => d)
    .attr('dy', '0.32em')
    .attr('x', 40);
  //.attr('x', textOffset) 
 // const colorLegengG = svg.append('g')
  //                        .attr('transform', `translate(180,15)`);
                        //  .call(colorLegend(colorScale));
                          
});}


function drawBubble(year){

svg.selectAll('g').remove();
const g = svg.append('g');

//panning & zooming
svg.call(zoom().on('zoom', () => {
  g.attr('transform',d3.event.transform);
}));
  
  
json('chinaMap.json')
  .then(data => {
  //const provinces = feature(data, data)
  //console.log(data);
  
  // 这是干嘛的。。。
const turnNum = function(nums){
	return nums.map(Number);
}
  

                                             
  g.selectAll('paths')
     .data(data.features)
     .enter().append('path')
     .attr('d', pathGenerator)
     .attr('fill', 'beige')
     .append('title')
     .text(d => d.properties.name + ': ' + rowById[d.properties.id].value + '\n' + rowById[d.properties.id].newProducts)
  
  const radiusScale = scaleSqrt();
  //max(data.features.properties.value)
  radiusScale.domain([0,70])
             .range([0,20]);
  
  g.selectAll('circle')
    .data(data.features)
    .enter().append('circle')
    .attr('cx', d => projection(geoCentroid(d))[0])
    .attr('cy', d => projection(geoCentroid(d))[1])
    .attr('r', d => radiusScale(rowById[d.properties.id].value))
    .attr('fill', 'blue')
    .attr('opacity', 0.7);
  
  //size legend
  const sizeLegendG = svg.append('g').attr('transform', `translate(10,15)`)
const groups = sizeLegendG.selectAll('g')
    .data(radiusScale.ticks(8).filter(d => d !== 0));
  const groupsEnter = groups
    .enter().append('g')
  groupsEnter
    .merge(groups)
    .attr('transform', (d ,i) =>
          `translate(40,${i * 25 +170 })`
          // `translate(0,${i * spacing})`
          );
  groups.exit().remove();
  
  groupsEnter.append('circle')
    .merge(groups.select('circle'))
    .attr('r', radiusScale)
    .attr('stroke', 'black')
    .attr('opacity', 0.7)
    .attr('fill', 'blue');
  //.attr('r', circleRadius)
  
  groupsEnter.append('text')
    .merge(groups.select('text'))
    .text(d => d)
    .attr('dy', '0.32em')
    .attr('x', 40);
});};

//drawBubble(2010)

// time slider
 var year = 2000;
 var sliderStep = d3
    .sliderBottom()
    .min(2000)
    .max(2015)
    .width(450)
    //.tickFormat(d3.format('.2%'))
    .ticks(15)
    .step(1)
    //.default(2015)
    .on('onchange', val => {
      d3.select('p#value-step').text(val);
     // console.log(val);
      year = val;
      drawMap();
    });  

  var gStep = d3
    .select('div#slider-step')
    .append('svg')
    .attr('width', 800)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

  gStep.call(sliderStep);

  d3.select('p#value-step')
    .text('年份： '+sliderStep.value());
      
const radioButtons = document.querySelectorAll('input[name="mapButton"]');
for(const radioButton of radioButtons){
        radioButton.addEventListener("change", checkStatus);
}

function checkStatus(e){
  console.log('checkStatus');
  if (this.checked){
    status = this.value};
  console.log(this.value);
  drawMap()};
  

function drawMap(){
  console.log('redraw');
    if(status == 'Bubble'){
      console.log('bubble');
      dataProcess(year);
      setTimeout(() => {drawBubble(year)},0)}
    else{
      console.log('choropleth');
      dataProcess(year);
      setTimeout(() => {drawChoropleth(year)},0)}};

//test
//初始设定
 status = 'Choropleth';
year = 2000;
drawMap();