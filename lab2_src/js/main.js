// 数据文件的路径
const data_path = './data/data.json'

// 窗口的尺寸
let WIDTH = $(window).width()
let HEIGHT = $(window).height()

//剩余可使用窗口的尺寸&坐标
let SPACEWIDTH = WIDTH
let SPACEHEIGHT = HEIGHT
let SPACEX = 0
let SPACEY = 0


/**
 * 计算文字的显示宽度
 * 调用方法：String.visualWidth(fontsize)
 * @param {number} fontsize 字体大小
 * @returns number 文字的宽度
 */
String.prototype.visualWidth = function(fontsize){
  let ruler = document.getElementById('__ruler__')
  ruler.setAttributeNS(null, 'font-size', fontsize || '1em')
  ruler.innerHTML = this
  return ruler.getBoundingClientRect().width
}
// 计算文字的显示高度
String.prototype.visualHeight = function(fontsize){
  let ruler = document.getElementById('__ruler__')
  ruler.setAttributeNS(null, 'font-size', fontsize || '1em')
  ruler.innerHTML = this
  return ruler.getBoundingClientRect().height
}

/**设置字体 */
function setFontFamily(){

  // 考虑不同系统的字体兼容性
  let ua = navigator.userAgent.toLowerCase()
  let fontFamily = "Khand-Regular"
  if (/\(i[^;]+;( U;)? CPU.+Mac OS X/gi.test(ua)) {
    fontFamily = "PingFangSC-Regular"
  }

  // 设置字体
  d3.select("body").style("font-family", fontFamily)
}

/**计算给各个节点分配的空间 */
function Treemap(data, width, height){

  /**
   * 设置节点的value = 该节点所有子节点value之和
   * 递归的计算
   */
  function setValueOfNodes(node){
    if (node.children === undefined) return
    let value = 0
    for (let childNode of node.children) {
      setValueOfNodes(childNode)
      value += childNode.value
    }
    node.value = value
  }

  // 从根节点开始计算
  setValueOfNodes(data)

  let leaves = []

  /**
   * 计算各个节点所占据的空间
   * 采用递归的方法
   * @param {object} node 当前节点
   * @param {number} x 给当前节点分配的空间的左上角横坐标
   * @param {number} y 给当前节点分配的空间的左上角纵坐标
   * @param {number} width 给当前节点分配的空间的宽度
   * @param {number} height 给当前节点分配的空间的高度
   * @param {number} direction 子空间分配的方向：'x'或'y'
   * @param {string} ancestor 当前节点对应的第一层节点
   * @returns 无返回值
   */

 
  //className: 位置是否确定
  //ancestor2: 第二层ancestor
  function calculatePositionOfNodes(node, x, y, width, height, direction, className, ancestor, ancestor2) {

    // 将叶节点存储到数组中
    /**
     * 三元表达式 exp ? a : b
     * 如果exp为true，则返回a，否则返回b
     * 等价于python中的 a if exp else b
     */
    if (node.children === undefined) {
      let leaf = {
        name: node.name,
        value: node.value,
        x: x,
        y: y,
        width: width,
        height: height,
        parent: ancestor,
        parent2: ancestor2 == 0 ? node.name : ancestor2 
      }
      leaves.push(leaf) // Array.push(value)向数组末尾增加一个元素value
      return
    }

    // 定义比例尺!!
    
    SCALE = function(a, domainMax, rangeMax){
      return (a * rangeMax / domainMax)
     }

    // 递归计算子节点占据的空间
    let totalWidth = 0
    let totalHeight = 0

    //childNodeLibrary:该node所有一级childNode库
    let childNodeLibrary = []
    r = 0 //记录顺序
    for (let childNode of node.children){
      let childNODE = {
      name: childNode.name,
      className : 0,
      ancestor : ancestor == -1 ? childNode.name : ancestor,
      ancestor2: ancestor2 === -1 ? 0 :( ancestor2 === 0 ? childNode.name : ancestor2),
      value : childNode.value,
      rank: r
    }
      
      r++
      childNodeLibrary.push(childNODE)
      }
    
    childNodeLibrary.sort((a, b) => {return b.value-a.value;}); //按value从大到小排序
    childNodeLibrary[0].className = 1
    
    //第一个方形
    //空余画布尺寸
    SPACEWIDTH = width - totalWidth
    SPACEHEIGHT = height - totalHeight
    //计算direction&尺寸
    if(SPACEWIDTH >= SPACEHEIGHT){
        childNodeLibrary[0].direction = 'x'
        childNodeLibrary[0].width = SCALE(childNodeLibrary[0].value, node.value, SPACEWIDTH)
        childNodeLibrary[0].height = SPACEHEIGHT
        directStandard = 'y' //这串方形的共同方向
     }
    else{
        childNodeLibrary[0].direction = 'y'
        childNodeLibrary[0].width = SPACEWIDTH
        childNodeLibrary[0].height = SCALE(childNodeLibrary[0].value, node.value, SPACEHEIGHT)
        directStandard = 'x'
      }
   
    //计算长宽比
    aspectRatioStandard = Math.max(childNodeLibrary[0].width/childNodeLibrary[0].height,childNodeLibrary[0].height/childNodeLibrary[0].width)
    
    valueSum = 0 
    
    valueBefore = 0 //已经固定的value和
    
    if(childNodeLibrary.length == 1){
      childNodeLibrary[0].x = x
      childNodeLibrary[0].y = y
      childNodeLibrary[0].width = SPACEWIDTH
      childNodeLibrary[0].height = SPACEHEIGHT
    }
    else{
    for (i=1; i<childNodeLibrary.length; i++) {
      let childNode = childNodeLibrary[i]

      childNode.direction = directStandard

      //从第几个方形开始同向排列
      index = childNodeLibrary.findIndex(item => {return item.className == 1})
      
      //本串平行方形的value和
      
      valueSum = 0
      for(j=index; j<=i; j++){
        valueSum += childNodeLibrary[j].value
      }

      //求此childnode的长宽
      if(childNode.direction == 'x'){
        childNode.width = SCALE(childNode.value, valueSum, SPACEWIDTH)
        childNode.height = SCALE (valueSum, node.value-valueBefore, SPACEHEIGHT)
      }
      else{
        childNode.width = SCALE(valueSum, node.value-valueBefore, SPACEWIDTH)
        childNode.height = SCALE(childNode.value, valueSum, SPACEHEIGHT)
      }
      
      //比较长宽比判断ok不
      aspectRatio = Math.max(childNode.width/childNode.height, childNode.height/childNode.width)
      if(aspectRatio > aspectRatioStandard){
        //不ok：重新求此方形定位坐标，前面方形位置固定
        //本方形另起炉灶
        childNode.className = 1
        for(j=0; j < i; j++){
          childNodeLibrary[j].className = 2
        }

        //确定本串其他方形坐标
        valueSum -= childNode.value
        childNodeLibrary[index].x = SPACEX
        childNodeLibrary[index].y = SPACEY

        if(childNode.direction == 'x'){
          //继续确定本串其他方形的坐标
          childNodeLibrary[index].width = SCALE (childNodeLibrary[index].value, valueSum, SPACEWIDTH)
          childNodeLibrary[index].height = SCALE (valueSum, node.value-valueBefore, SPACEHEIGHT)
          if((i-index) > 1){
            for(j=index+1; j<i; j++){
              childNodeLibrary[j].x = childNodeLibrary[j-1].x + childNodeLibrary[j-1].width
            childNodeLibrary[j].y = SPACEY
            childNodeLibrary[j].width = SCALE(childNodeLibrary[j].value, valueSum, SPACEWIDTH)
            childNodeLibrary[j].height = SCALE(valueSum, node.value-valueBefore, SPACEHEIGHT)
            }
          }
          //新的空余画布的尺寸&坐标
          SPACEY += childNodeLibrary[i-1].height
          SPACEHEIGHT -= childNodeLibrary[i-1].height

        }
        else{
          //继续确定本串其他方形的坐标
          childNodeLibrary[index].width = SCALE(valueSum, node.value-valueBefore, SPACEWIDTH)
          childNodeLibrary[index].height = SCALE(childNodeLibrary[index].value, valueSum, SPACEHEIGHT)
          
          if((i-index) > 1){
            for(j=index+1; j<i; j++){
            childNodeLibrary[j].x = SPACEX
            childNodeLibrary[j].y = childNodeLibrary[j-1].y + childNodeLibrary[j-1].height
            childNodeLibrary[j].width = SCALE(valueSum, node.value-valueBefore, SPACEWIDTH)
            childNodeLibrary[j].height = SCALE(childNodeLibrary[j].value, valueSum, SPACEHEIGHT)
            }
          }
        
          //新的空余画布的尺寸&坐标
          SPACEX += childNodeLibrary[i-1].width
          SPACEWIDTH -= childNodeLibrary[i-1].width

          
        }
       
        //计算新的direction&尺寸
        if(SPACEWIDTH >= SPACEHEIGHT){
          childNode.direction = 'x'
          childNode.width = SCALE(childNode.value, node.value-valueBefore, SPACEWIDTH)
          childNode.height = SPACEHEIGHT
          directStandard = 'y' //这串方形的共同方向
        }
        else{
          childNode.direction = 'y'
          childNode.width = SPACEWIDTH
          childNode.height = SCALE(childNode.value, node.value-valueBefore, SPACEHEIGHT)
          directStandard = 'x'
        }
        //最后一个方形尺寸
        if(i == childNodeLibrary.length - 1){
          childNodeLibrary[i].x = SPACEX
          childNodeLibrary[i].y = SPACEY
          childNodeLibrary[i].width = SPACEWIDTH
          childNodeLibrary[i].height = SPACEHEIGHT
        }

        //计算长宽比
        aspectRatioStandard = Math.max(childNode.width/childNode.height,childNode.height/childNode.width)
        
        valueBefore += valueSum
        valueSum = 0
      }
      else{
        //ok:更新长宽比比较标准
        aspectRatioStandard = aspectRatio
        
        if(i == childNodeLibrary.length-1){
         //确定本串其他方形坐标
        childNodeLibrary[index].x = SPACEX
        childNodeLibrary[index].y = SPACEY

        if(childNode.direction == 'x'){
          console.log('x')
          //继续确定本串其他方形的坐标
          childNodeLibrary[index].width = SCALE (childNodeLibrary[index].value, valueSum, SPACEWIDTH)
          childNodeLibrary[index].height = SCALE (valueSum, node.value-valueBefore, SPACEHEIGHT)
          if(i > index){
            for(j=index+1; j<=i; j++){
              childNodeLibrary[j].x = SPACEX + childNodeLibrary[j-1].width
            childNodeLibrary[j].y = SPACEY
            }
          }

        }
        else{
          //继续确定本串其他方形的坐标
          childNodeLibrary[index].width = SCALE(valueSum, node.value-valueBefore, SPACEWIDTH)
          childNodeLibrary[index].height = SCALE(childNodeLibrary[index].value, valueSum, SPACEHEIGHT)
          if(i > index ){
            for(j=index+1; j<=i; j++){
            childNodeLibrary[j].x = SPACEX
            childNodeLibrary[j].y = SPACEY + childNodeLibrary[j-1].height
            }
          }
        }

        
          }
        }
      
    }
  }
    
    childNodeLibrary.sort((a, b) => {return a.rank-b.rank;}); //按value从大到小排序
   
    //将数据存储到node中
    k = 0
    for(let childNode of node.children){
      childNode.x = childNodeLibrary[k].x
      childNode.y = childNodeLibrary[k].y
      childNode.height = childNodeLibrary[k].height
      childNode.width = childNodeLibrary[k].width
      childNode.ancestor = childNodeLibrary[k].ancestor
      childNode.ancestor2 = childNodeLibrary[k].ancestor2
      childNode.direction = childNodeLibrary[k].direction
      k++
    }

    for(let childNode of node.children){
      //更新参数
      SPACEX = childNode.x
      SPACEY = childNode.y
      SPACEHEIGHT = childNode.height
      SPACEWIDTH = childNode.width
      calculatePositionOfNodes(childNode, 
          childNode.x, 
          childNode.y, 
          childNode.width,
          childNode.height,
          childNode.direction,
          0,
          childNode.ancestor,
          childNode.ancestor2
          )
 
       }
  }

  // 从根节点开始计算
  calculatePositionOfNodes(data, 0, 0, width, height, 'x', 0, -1, -1)
  return leaves
}



/**绘制treemap */
function drawTreemap(data) {

  /**计算各个叶节点分配的空间 */
  let leaves = Treemap(data, WIDTH, HEIGHT)

  // 添加svg画布
  let svg = d3
    .select("#container")
    .select("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)

  // 定义颜色比例尺
  let color = d3.scaleOrdinal(d3.schemeCategory10)

  /**
   * 绘制叶节点
   * 对于一条数据对应多个元素的情况，可以先绘制一个封装的<g>元素，然后在<g>元素内部增加相应的元素
   */
  let leaf = svg
    .selectAll("g")
    .data(leaves)
    .join("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`) //转移位置

  // 矩形
  leaf
    .append("rect")
    .attr("id", (d) => d.name)
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("fill", (d) => color(d.parent))
    .attr("fill-opacity", 0.6) //透明度
    .attr("width", (d) => d.width)
    .attr("height", (d) => d.height)

  // 文字
  /**
   * selectAll可以嵌套selectAll
   * String.split(string) 将字符串根据指定的字符串切分
   * Array.concat(element(s)) // 数组的拼接
   * tspan 元素用于在SVG中绘制多行文本
   */
  let visible = (d)=>{
    let data = d.name.split(/(?=[A-Z][a-z])|\s+/).concat(d.value)
    let width = Math.max(...data.map(d=>{
      return d.toString().visualWidth()
    }))//字符串显示长度最大值，取最大值
    let height = data.map(d=>{
      return d.toString().visualHeight()
    }).reduce((acc, d)=> acc+d, 0)
    if(width <= d.width && height <= d.height){
      return null
    }
    return 'none'
  }
  leaf
    .append("text")
    .style('display', (d)=>{
      return visible(d)
    })
    .selectAll("tspan")
    .data((d) => d.name.split(/(?=[A-Z][a-z])|\s+/).concat(d.value))
    .join("tspan")
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    )
    .attr("fill-opacity", (d, i, nodes) =>
      i === nodes.length - 1 ? 0.7 : null
    )
    .text((d) => d)

  // 交互
  leaf
    .on('mouseover', function(e,datum){
      leaf
        .style('opacity', d=>d.parent === datum.parent ? 1 : 0.3)
      
    
      leaf
        .filter(d=>d.parent === datum.parent)
        .select('rect')
        .style('fill', (d) => color(d.parent2))
    
        
      
        leaf
        .filter(d=>d.name === datum.name)
        .select('rect')
        .style('stroke', 'black')
        .style('stroke-width', 3)
        

        leaf
        .filter(d=>d.name === datum.name)
        .select('text')
        .style('display', null)

    })
    .on('mouseout', function(e,datum){
      leaf
        .style('opacity', 1)


        leaf
        .filter(d=>d.name === datum.name)
        .select('rect')
        .style('stroke', 'white')
        .style('stroke-width', 1)
        .style("fill", (d) => color(d.parent))

        leaf
        .filter(d=>d.parent === datum.parent)
        .select('rect')
        .style('fill', (d) => color(d.parent))


        leaf
        .filter(d=>d.name === datum.name)
        .select('text')
        .style('display', d=>visible(d))
      
    })
}


// 主函数
function main() {
  d3.json(data_path).then(function(data){
    setFontFamily() // 设置字体
    
    drawTreemap(data) // 绘制树图
  })
}

main()