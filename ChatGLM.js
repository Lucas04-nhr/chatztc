import plugin from '../../lib/plugins/plugin.js'
import https from 'http';
import fs from 'fs';
import strDiff from './js/str-diff-function.js';


var ChatGLMConfig = JSON.parse(
  await fs.promises.readFile(
    new URL('./config/config.json', import.meta.url)
  )
)



var ChatGLMWebSocket = await (async function(){
	var replyEnv = null;
	//websocket必须设置回复环境
	var setReplyFunc = function(user_id,env) {
		replyEnv = env;
	}
	var qqreply = function(msg = '', quote = false, data = {}) {
		if(replyEnv){
			replyEnv.reply(msg, quote, data);
		}
	}
	
	//logger.info('[ChatGLM,strDiff.strGetDiffRate]', strDiff);
	//logger.info('[ChatGLM,strDiff.strGetDiffRate]', strDiff.strGetDiffRate("#ai将上次对白设置为人设","#ai设置人设"));
	
	var writeFileAsync =( path, data  )=>{
	  return new Promise(function(resolve,reject){
		  fs.writeFile(path,data , function(err,data) {
			if (err) {
				reject(err);
				throw err;
			}
			resolve(data);
		});
	  });
	};
	
	var readfileAsync = function(path) {
		return new Promise((resolve,reject) => {  
			fs.readFile(path,(err,data) => {
				if(err){
					 reject(err)
				} else {
					 resolve(data)
				}         
			})
		})
	}
 
	//await writeFileAsync(`./plugins/example/data/${user_id}.json`,"123");
	//var getdata = await readfileAsync(`./plugins/example/data/${user_id}.json`);
	//logger.info('[ChatGLM,readfileAsync,getdata]', getdata);
	var user_data_cache = {};
	var user_data_cache_delete_time_out = 1000 * 60 *5;//数据写入缓存之后会延时删除，防止内存爆炸
	var user_data_cache_delete_handler = {};
	var _get_user_data_by_key = async function(user_id,key){
		//缓存当中有数据则从缓存读取
		if(user_data_cache[user_id] && user_data_cache[user_id][key]){
			return user_data_cache[user_id][key];
		}
		var getdatajson = null;
		try {
			getdatajson = await readfileAsync(`./plugins/chatztc/data/${user_id}.json`);
		} catch (error) {
		}
		var getdata = null;
		if(getdatajson){
			try {
				getdata = JSON.parse(getdatajson);
			} catch (error) {
			}
		}
		var data = null;
		if(getdata && getdata[key]){
			data = getdata[key];
		}
		//从磁盘中读取之后写入缓存
		user_data_cache[user_id] = getdata;
		user_data_cache_delete_function(user_id);
		return data;
	};
	var _set_user_data_by_key = async function(user_id,key,data){
        var getdata = null;
        //缓存当中有数据则从缓存读取
        if(user_data_cache[user_id]){
            getdata = user_data_cache[user_id];
        }else{
            var getdatajson = null;
            try {
                getdatajson = await readfileAsync(`./plugins/chatztc/data/${user_id}.json`);
            } catch (error) {
            }
            if(getdatajson){
				try {
					getdata = JSON.parse(getdatajson);
				} catch (error) {
				}
            }
        }
		if(!getdata){
			getdata = {};
		}
		getdata[key] = data;
		var getdatajson = JSON.stringify(getdata);
		var ret = await writeFileAsync(`./plugins/chatztc/data/${user_id}.json`,getdatajson);
        //从磁盘中读取之后写入缓存(不写读取时可能会读到旧的缓存)
        user_data_cache[user_id] = getdata;
		return ret;
	};
	//延时删除内存缓存的方法
	var user_data_cache_delete_function = function(user_id){
		if(user_data_cache_delete_handler[user_id]){
			clearTimeout(user_data_cache_delete_handler[user_id]);
		}
		user_data_cache_delete_handler[user_id] = setTimeout(function(){
			delete user_data_cache[user_id];
		},user_data_cache_delete_time_out);
	}
	
	var _get_chat_history = async function(user_id){
		return await _get_user_data_by_key(user_id,"chat_history");
	};
	var _set_chat_history = async function(user_id,chat_history){
		return await _set_user_data_by_key(user_id,"chat_history",chat_history);
	};
	var _get_chat_character = async function(user_id){
		return await _get_user_data_by_key(user_id,"chat_character");
	};
	var _set_chat_character = async function(user_id,chat_character){
		return await _set_user_data_by_key(user_id,"chat_character",chat_character);
	};
	
	
	
	var set_character = async function(chat_msg,user_id,_this){
		var chat_history = await _get_chat_history(user_id);
		if(!chat_history){
			chat_history = [];
		}
		if(chat_history.length>0){
			var chat_character = chat_history[chat_history.length-1];
            await _set_chat_character(user_id,chat_character);
			chat_history = chat_history.slice(0,chat_history.length-1);//同时删除对白记录的最后一条
            await _set_chat_history(user_id,chat_history);
			_this.reply("人设设置成功");
		}else{
			_this.reply("还没有历史对白，请先进行一次对话");
		}
	}
	var get_character = async function(chat_msg,user_id,_this){
		var chat_character = await _get_chat_character(user_id);
		if(chat_character){
			return chat_character;
		}else{
			_this.reply("还没有设置人设，请先设置人设");
		}
	}
	var del_character = async function(chat_msg,user_id,_this){
        await _set_chat_character(user_id,null);
		_this.reply("删除人设完成");
	}
	var get_history = async function(chat_msg,user_id,_this){
		return await _get_chat_history(user_id);
	}
	var del_history = async function(chat_msg,user_id,_this){
		await _set_chat_history(user_id,[]);
		_this.reply("清除历史成功");
		return ;
	}


	var post_data = function(data,callback){
		logger.info('[ChatGLM,POST,send]', data);
		var urlInfo = new URL(ChatGLMConfig.post_url);
		//logger.info('[ChatGLM,POST,urlInfo]', urlInfo);
		var port = urlInfo.port;
		if(!port){
			port = 80;
		}
		var data_str = JSON.stringify(data);
		var options = {
		  hostname: urlInfo.hostname,
		  port: port,
		  path: urlInfo.pathname,
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(data_str)
		  }
		}
		var req = https.request(options, (res) => {
		  //logger.info('[ChatGLM,POST,statusCode]',res.statusCode)
		  //logger.info('[ChatGLM,POST,HEADERS]',res.headers)

			var _data="";//返回数据流
			//数据
			res.on('data', function (chunk) {
				_data+=chunk;
				//logger.info('[ChatGLM,POST,retdata]', chunk);
			});
			// 结束回调
			res.on('end', function(){
				logger.info('[ChatGLM,POST,retend]', _data);
				callback(_data);
			});
		})
		req.on('error', (error) => {
		  logger.info('[ChatGLM,POST,error]',error)
		})
		req.write(data_str)
		req.end();
	}


	
	
    var chat_log_arr = null; 
    var ws_send_arr = []; 
		
	
    var send_msg = async function(msg,user_id,callback){
		//设置ai的历史记忆
			var history_temp_arr = [];
			var chat_character = await _get_chat_character(user_id);
			logger.info('[ChatGLM,send_msg，chat_character]', chat_character);
			if(chat_character){
				history_temp_arr.push(chat_character);
			}
			var chat_history = await _get_chat_history(user_id);
			if(!chat_history){
				chat_history = [];
			}
			if(chat_history.length<=ChatGLMConfig.history_num){
				for(var i=0;i<chat_history.length;i++){
					history_temp_arr.push(chat_history[i]);
				}
			}else{
				for(var i=chat_history.length-ChatGLMConfig.history_num;i<chat_history.length;i++){
					history_temp_arr.push(chat_history[i]);
				}
			}
			post_data({"prompt": msg, "history": history_temp_arr},async function(ret_data){
				var ret_obj = JSON.parse(ret_data);
				if(ret_obj && ret_obj.history){
					chat_history.push(ret_obj.history[ret_obj.history.length-1]);
					//logger.info('[ChatGLM,chat_history]', chat_history);
					await _set_chat_history(user_id,chat_history);
				}
				if(ret_obj && ret_obj.response){
					callback(ret_obj.response);
				}
			});
	};
	
	//send_msg
	
	//logger.info('[ChatGLM,WebSocket,debug]', "到这里了");
	//logger.info('[ChatGLM,WebSocket,debug]', this.ws_session_hash);
	

	//下面不能加'echo-protocol'，否则会报Can`t connect due to "Sec-WebSocket-Protocol header"的错。因为服务器没有返回对应协议规定的信息
	//ws.connect(ChatGLMConfig.websocket_url); //, 'echo-protocol');
	function get_config_text(config_word) {
		if(!ChatGLMConfig.str_prefix[config_word]){
			return null;
		}
		var public_prefix= '';
		if(ChatGLMConfig.public_prefix){
			public_prefix = ChatGLMConfig.public_prefix;
		}
		return public_prefix + ChatGLMConfig.str_prefix[config_word].text;
	}
	return {
		setReplyFunc:setReplyFunc,
		send_msg:send_msg,
		get_history:get_history,
		del_history:del_history,
		set_character:set_character,
		get_character:get_character,
		del_character:del_character,
		get_config_text:get_config_text,
	};
})();



export class ChatZTC extends plugin {
	
  constructor () {
	  var rule_arr =[];
	  
	  for(var key in ChatGLMConfig.str_prefix){
		  rule_arr.push({
          /** 命令正则匹配优先匹配 */
          reg: '^'+ChatGLMWebSocket.get_config_text(key)+'\s*\w*',
          /** 执行方法 */
          fnc: 'get_user_msg'//
        });
	  }
	  
	  if(ChatGLMConfig.answer_all_chat){
		  rule_arr.push({
          /** 命令正则匹配 */
          reg: '^\s*\w*',
          /** 执行方法 */
          fnc: 'get_user_msg'//
        });
	  }
	  
    super({
      name: '聊天接口',
      dsc: '调用ChatGLM接口进行聊天',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 5000+10000,//优先级需要调低，因为设置了匹配任何聊天内容
      rule: rule_arr
    })

	  /** 收到用户消息 */
	  this.get_user_msg = async function(e) {
		  var _this = this;
		logger.info('[用户命令]', e.msg);
		//this.reply("用户发送的内容为:"+e.msg)
		//logger.info('[用户信息]', e);//user_id 用户qq号
		var complete_msg = e.msg;
		var chat_msg = e.msg;
		/**
		* 校验只要是数字（包含正负整数，0以及正负浮点数）就返回true
		**/
		function isNumber(val){
			var regPos = /^[0-9]+.?[0-9]*/; //判断是否是数字。
			if(regPos.test(val) ){
				return true;
			}else{
				return false;
			}
		}
		//用户帮助
		function help(chat_msg,user_id,_this){
			var help_str = "------ai指令列表------";
			for(var key in ChatGLMConfig.str_prefix){
				help_str+='\n\n'+ChatGLMWebSocket.get_config_text(key)+'\n'+"    "+ChatGLMConfig.str_prefix[key].note;
			}
			_this.reply(help_str);
		}
		//调用ai聊天对话
		function chat(chat_msg,user_id,_this){
			ChatGLMWebSocket.setReplyFunc(user_id,this);
			//var res = ChatGLMWebSocket.ws_send({"fn_index":0,"data":[null,chat_msg,2048,0.7,0.95,true],"event_data":null,"session_hash":ChatGLMWebSocket.getSessionHash()});
			ChatGLMWebSocket.send_msg(chat_msg,user_id,function(res_msg){
				if(res_msg){
					_this.reply(res_msg);
				}
			});
		}
		
		function set_history_num(chat_msg,user_id,_this){
			if(isNumber(chat_msg)){
				ChatGLMConfig.history_num=parseInt(chat_msg);
				_this.reply("设置成功，当前记忆条数:"+ChatGLMConfig.history_num);
			}else{
				_this.reply("末尾请输入数字，示例:#ai设置记忆条数3");
			}
		}
		function get_history_num(chat_msg,user_id,_this){
			_this.reply("当前记忆条数:"+ChatGLMConfig.history_num);
		}
          async function set_character(chat_msg,user_id,_this){
              await ChatGLMWebSocket.set_character(chat_msg,user_id,_this);
          }
          async function get_character(chat_msg,user_id,_this){
              _this.reply(JSON.stringify(await ChatGLMWebSocket.get_character(chat_msg,user_id,_this)));
          }
          async function del_character(chat_msg,user_id,_this){
              await ChatGLMWebSocket.del_character(chat_msg,user_id,_this);
          }
		async function get_history(chat_msg,user_id,_this){
			var history = await ChatGLMWebSocket.get_history(chat_msg,user_id,_this);
			logger.info('get_history,', history);//
			await ChatZTC.forwardMsg({ _this,history });
			//_this.reply(JSON.stringify(await ChatGLMWebSocket.get_history(chat_msg,user_id,_this)));
		}
		async function del_history(chat_msg,user_id,_this){
            await await ChatGLMWebSocket.del_history(chat_msg,user_id,_this);
		}
		
		//如果使用了聊天开头字符串匹配，则切掉头部
		//识别使用的指令并调用对应的函数
		
		/*
		help:{text:"#ai帮助",note:"唤出ai帮助"},//
		chat:{text:"#ai:",note:"ChatGLM匹配聊天前缀"},//
		set_history_num:{text:"#ai设置记忆条数",note:"用来设置ai保存的历史聊天数量,示例:#ai设置记忆条数3"},//
		set_character:{text:"#ai将上次对白固定为人设",note:"用来设置1条ai始终记得的历史聊天"},//
		get_history:{text:"#ailog",note:"输出聊天历史"},//
		*/
		
		var find_str_prefix_text = false;//是否找到了聊天提示词
		var key_find = null;
		for(var key in ChatGLMConfig.str_prefix){
			if(ChatGLMWebSocket.get_config_text(key) == e.msg.substr(0,ChatGLMWebSocket.get_config_text(key).length)){
				find_str_prefix_text = true;
				chat_msg = e.msg.substr(ChatGLMWebSocket.get_config_text(key).length);
				key_find = key;
				logger.info('[用户聊天,chat_msg,key]', chat_msg+","+key);
				break;
			}
		}
		//找到了完全匹配的关键词前缀
		if(find_str_prefix_text){
			switch (key_find){
					case "help":
						help(chat_msg,e.user_id,_this);
						break;
					case "chat":
						chat(chat_msg,e.user_id,_this);
						break;
					case "set_history_num":
						set_history_num(chat_msg,e.user_id,_this);
						break;
					case "get_history_num":
						get_history_num(chat_msg,e.user_id,_this);
						break;
					case "set_character":
                        await set_character(chat_msg,e.user_id,_this);
						break;
					case "get_character":
                        await get_character(chat_msg,e.user_id,_this);
						break;
					case "del_character":
                        await del_character(chat_msg,e.user_id,_this);
						break;
					case "get_history":
						await get_history(chat_msg,e.user_id,_this);
						break;
					case "del_history":
                        await del_history(chat_msg,e.user_id,_this);
						break;
					default :
						find_str_prefix_text = false;
			}
		}else{
			//没有找到完全匹配的关键词前缀，同时匹配到了公共前缀
			if(ChatGLMConfig.public_prefix == e.msg.substr(0,ChatGLMConfig.public_prefix.length) && ChatGLMConfig.automatic_suggestion_order){
				var key_rate_arr = [];
				for(var key in ChatGLMConfig.str_prefix){
					var rate = strDiff.strGetDiffRate(ChatGLMWebSocket.get_config_text(key),e.msg);
					key_rate_arr.push({
						key:key,
						text:ChatGLMWebSocket.get_config_text(key),
						rate:rate,
					});
				}
				key_rate_arr.sort(function(a,b){
					return b.rate-a.rate;
				});
				_this.reply("您想使用的指令是这个吗:'"+key_rate_arr[0].text+"'"+'\n'+"如果需要所有指令及说明，请输入'"+ChatGLMWebSocket.get_config_text("help")+"'");
				//logger.info('[用户聊天,没有找到完全匹配的关键词前缀]', key_rate_arr);
			}
		}

		//不是#开头的字符串进来了可以直接触发聊天
		if(ChatGLMConfig.answer_all_chat && ChatGLMConfig.public_prefix != e.msg.substr(0,ChatGLMConfig.public_prefix.length)){
			if(!find_str_prefix_text){
				chat(chat_msg,e.user_id,_this);
			}
		}
	  };
  }
	/**
	 * 折合消息
	 */
	makeMsg = ({ data }) => {
		const msgList = []
		for (let item of data) {
			msgList.push({
				message: item,
				/*我的昵称*/
				nickname: Bot.nickname,
				/*我的账号*/
				user_id: Bot.uin,
			})
		}
		return msgList
	}
	/**
	 * @param { e, data } param0
	 * @returns
	 */
	forwardMsg = async ({ e, data }) => {
		logger.info('[forwardMsg,e]', e);
		logger.info('[forwardMsg,data]', data);
		if (data.length == 1) {
			await e.reply(data[0])
			return
		}
		/*制作合并转发消息以备发送*/
		await e.reply(await Bot.makeForwardMsg(this.makeMsg({ data })))
		return
	}
}







