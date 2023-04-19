
export default class strDiff {
//新的算法，效率高了很多
static strToDiffArr($str0,$str1,$minSameLen){
if(!$minSameLen){
	$minSameLen = 5;//至少需要重叠多少个字才形成对应关系
}

//console.time(1)



//echo '开始内存：'.memory_get_usage()/1024/1024, '';  
//第一个字符串第一个位置开始，和第二个字符串依次比较，看看重叠的长度有多少，重叠长度最长的位置则为对应位置，记录长短字符串的对应位置
//设置一个阈值，重叠长度小于阈值则无效了
//没有对应位置的字符串记录起始点结束点，记录字符串的内容
var $str0Index=0;
var $str1Index=1;
//假设第一个字符串比较短
var $str0Len = $str0.length;
var $str1Len = $str1.length;
//第一个字符串需要比第二个短，如果不是，则交换两个字符串
if($str1Len<$str0Len){
	$str0Index=1;
	$str1Index=0;
	var $vTemp = $str1;
	$str1 = $str0;
	$str0 = $vTemp;
	$vTemp=$str1Len;
	$str1Len=$str0Len;
	$str0Len = $vTemp;
}
var $str0MarkArr = new Array($str0Len).fill(0);
var $str1MarkArr = new Array($str1Len).fill(0);
var $diffArr = [];


var $charAtIndex0Arr = [];
var $charAtIndex1Arr = [];
var $strPlace0Arr = {};
var $strPlace0ArrLen = {};
var $strPlace1Arr = {};
var $strPlace1ArrLen = {};
var $str;
var $i,$j;
for($i=0;$i<$str0Len;$i++){
	$str = $str0.substr($i,1);
	$charAtIndex0Arr.push($str);
	if(!$strPlace0Arr[$str]){
		$strPlace0Arr[$str]={};
		$strPlace0ArrLen[$str]=0;
	}
	$strPlace0Arr[$str][$i+""]=1;
	$strPlace0ArrLen[$str]++;
}
for($i=0;$i<$str1Len;$i++){
	$str = $str1.substr($i,1);
	$charAtIndex1Arr.push($str);
	if(!$strPlace1Arr[$str]){
		$strPlace1Arr[$str]={};
		$strPlace1ArrLen[$str]=0;
	}
	$strPlace1Arr[$str][$i+""]=1;
	$strPlace1ArrLen[$str]++;
}
//print_r($strPlace1Arr);die;
//print_r($charAtIndex0Arr);die;

//代码原理:
//上面的字符串依次往后，依次保存每个字符内容，字符下标，下面出现次数，上面出现次数
//上面的数组进行排序，优先级依次为下面出现次数，上面出现次数，字符下标
//一个一个找对应关系，上面单个点对应下面多个点，只要对应关系长度超过阈值，就保留对应关系，上下删除对应长度下面所有的点的映射

//console.timeEnd(1)

//console.time(2)



var $charUpDownArr = [];
for($i =0;$i<$charAtIndex0Arr.length;$i++){
	$str = $charAtIndex0Arr[$i];
	if(!$strPlace1Arr[$str]){
		continue;
	}
	$charUpDownArr.push({
		's':$str,//string 依次保存每个字符内容
		'i':$i,//index 上面的字符下标
		'u':$strPlace0ArrLen[$str]?$strPlace0ArrLen[$str]:0,//up 上面出现次数
		'd':$strPlace1ArrLen[$str]?$strPlace1ArrLen[$str]:0,//down 下面出现次数
	});
}

//console.timeEnd(2)

//console.time(21)
$charUpDownArr.sort(function(a,b){
	if(a.d!=b.d){
		return a.d-b.d;
	}else if(a.u!=b.u){
		return a.u-b.u;
	}else{
		return a.i-b.i;
	}
});
//console.timeEnd(21)


//console.time(3)


//print_r($charUpDownArr);die;
var $upStartIndex;
var $downStartIndex;
var $row;
var $len;
for($i=0;$i< $charUpDownArr.length;$i++){
	$row = $charUpDownArr[$i];
	$upStartIndex = $row['i'];
	if($str0MarkArr[$upStartIndex]){
		continue;
	}
	outerLoop://外层循环
	for($downStartIndex in $strPlace1Arr[$row['s']]){
		$downStartIndex = parseInt($downStartIndex);
		if($str1MarkArr[$downStartIndex]){
			break;
		}
		$len = 1;
		while( ($upStartIndex+$len)<$str0Len && ($downStartIndex+$len)<$str1Len && $charAtIndex0Arr[$upStartIndex+$len]!==null &&  $charAtIndex1Arr[$downStartIndex+$len]!==null && $charAtIndex0Arr[$upStartIndex+$len]===$charAtIndex1Arr[$downStartIndex+$len]){
			if($str0MarkArr[$upStartIndex+$len]){
				break outerLoop;
			}
			if($str1MarkArr[$downStartIndex+$len]){
				break outerLoop;
			}
			$len++;
		}
		if($len>1 && $len>$minSameLen){
			var obj = {
				't':'r',//类型为对应关系
				'l':$len,//对应相同的长度为5
			};
			obj[$str0Index] = $upStartIndex;//字符串0开始位置
			obj[$str1Index] = $downStartIndex;//字符串1开始位置
			$diffArr.push(obj);
			//上下删除对应长度下面所有的点的映射
			for($j=0;$j<$len;$j++){
				$charAtIndex0Arr[$upStartIndex+$j]=null;
				delete $strPlace1Arr[$charAtIndex1Arr[$downStartIndex+$j]][$downStartIndex+$j];
				$str0MarkArr[$upStartIndex+$j]=1;
				$str1MarkArr[$downStartIndex+$j]=1;
			}
			break;
		}
	}
}

//console.timeEnd(3)
//console.time(4)
//echo '运行后内存：'.memory_get_usage()/1024/1024, '';  

//array_multisort($diffArr,SORT_NUMERIC,SORT_ASC,array_column($diffArr,'1'));

$diffArr.sort(function(a,b){
	return a['1']-b['1'];
});

//print_r($diffArr);die;


//console.log($diffArr);

//print_r($str0MarkArr);print_r($str1MarkArr);die;

//console.timeEnd(4)


function getTwoDiffArrCombine($row1,$row2){
	if($row1['0']+$row1['l']==$row2['0'] && $row1['1']+$row1['l']==$row2['1']){
		return {
		't':'r',
		'0':$row1['0'],
		'1':$row1['1'],
		'l':$row1['l']+$row2['l']
		};
	}
	return null;
}

var $diffArrNew = [];
var $rowSave=null;
var $rowTemp;
for($i=0;$i<$diffArr.length-1;$i++){
	$rowTemp = getTwoDiffArrCombine($rowSave?$rowSave:$diffArr[$i],$diffArr[$i+1]);
	if(!$rowTemp){
		if($rowSave){
			$diffArrNew.push($rowSave);
			$rowSave = null;
		}else{
			$diffArrNew.push($diffArr[$i]);
		}
	}else{
		$rowSave = $rowTemp;
	}
}
if($rowSave){
	$diffArrNew.push($rowSave);
}else{
	$diffArrNew.push($diffArr[$diffArr.length-1]);
}
$diffArr = $diffArrNew;





//console.time(5)

	var $sameLen = 0;
	for($j=0;$j<$str0MarkArr.length;$j++){
		if($str0MarkArr[$j]==0){
			$sameLen++;
		}else{
			if($sameLen>0){
				$diffArr.push({
					't':'v',//类型为内容
					'i':$str0Index,//字符串1
					's':$j-$sameLen,//开始位置为5
					'v':$str0.substr($j-$sameLen,$sameLen),//文本内容为字符串
				});
			}
			$sameLen=0;
		}
	}
			if($sameLen>0){
				$diffArr.push({
					't':'v',//类型为内容
					'i':$str0Index,//字符串1
					's':$j-$sameLen,//开始位置为5
					'v':$str0.substr($j-$sameLen,$sameLen),//文本内容为字符串
				});
			}
	$sameLen = 0;
	for($j=0;$j<$str1MarkArr.length;$j++){
		if($str1MarkArr[$j]==0){
			$sameLen++;
		}else{
			if($sameLen>0){
				$diffArr.push({
					't':'v',//类型为内容
					'i':$str1Index,//字符串1
					's':$j-$sameLen,//开始位置为5
					'v':$str1.substr($j-$sameLen,$sameLen),//文本内容为字符串
				});
			}
			$sameLen=0;
		}
	}
			if($sameLen>0){
				$diffArr.push({
					't':'v',//类型为内容
					'i':$str1Index,//字符串1
					's':$j-$sameLen,//开始位置为5
					'v':$str1.substr($j-$sameLen,$sameLen),//文本内容为字符串
				});
			}

//console.timeEnd(5)
	
	var $diffArrDeal = [];
	for(var i=0;i<$diffArr.length;i++){
		if($diffArr[i]){
			$diffArrDeal.push($diffArr[i]);
		}
	}
	$diffArr = $diffArrDeal;
return $diffArr;
}
//获取字符串不同的程度，完全相同为1，完全不同为0
static strGetDiffRate($str0,$str1){
	var $diffArr = this.strToDiffArr($str0,$str1,1);
	//不同的算法为
	//1.相同的字符串，在较长的字符串中的总长度占比:sameStrRate
	//2.顺序打乱的次数:num,打乱次数为零则数值为1，打乱数字越大，则越接近于0,(1/(num+1))
	var len0 = $str0.length;
	var len1 = $str1.length;
	var lenBig = len0>len1?len0:len1;
	var sameStrLength = 0;
	for(var i=0;i<$diffArr.length;i++){
		if($diffArr[i].t=="r" && $diffArr[i].l){
			sameStrLength+=$diffArr[i].l;
		}
	}
	var sameStrRate = sameStrLength/lenBig;
	var disruptionsNum = $diffArr.length - 1;
	var disruptionsRate = (1/(disruptionsNum+1));
	
	//console.log("sameStrRate:"+sameStrRate);
	//console.log("disruptionsRate:"+disruptionsRate)

	var sameStrRateTotalRate = 0.8;
	return sameStrRate * sameStrRateTotalRate + disruptionsRate *(1-sameStrRateTotalRate);
}

}
