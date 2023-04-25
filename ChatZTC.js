import plugin from '../../lib/plugins/plugin.js'
import https from 'http';
import fs from 'fs';
import strDiff from './js/str-diff-function.js';


var ChatGLMConfig;



var ChatGLMWebSocket = await (async function(){
	var basePath = "./plugins/chatztc";
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

	var getChatGLMConfig = async function(path){
		if(!path){
			path = './config/config.json';
		}
		var config = null;
		try {
			config = JSON.parse(await fs.promises.readFile(new URL(path, import.meta.url)));
		} catch (error) {
		}
		return config;
	};

	var setChatGLMConfig = async function(config){
		return await fs.promises.writeFile(new URL('./config/config.json', import.meta.url),JSON.stringify(config,null,"\t"));
	};

	ChatGLMConfig = await getChatGLMConfig();
	//如果没有配置则读取示例配置
	if(!ChatGLMConfig){
		ChatGLMConfig = await getChatGLMConfig('./config/config.json.example');
		await setChatGLMConfig(ChatGLMConfig);
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
			getdatajson = await readfileAsync(basePath+`/data/${user_id}.json`);
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
				getdatajson = await readfileAsync(basePath+`/data/${user_id}.json`);
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
		var getdatajson = JSON.stringify(getdata,null,"\t");
		var ret = await writeFileAsync(basePath+`/data/${user_id}.json`,getdatajson);
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
	var _get_history_to_post = async function(user_id){
		return await _get_user_data_by_key(user_id,"history_to_post");
	};
	var _set_history_to_post = async function(user_id,history_to_post){
		return await _set_user_data_by_key(user_id,"history_to_post",history_to_post);
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


	var set_history_num = async function(history_num,user_id,_this){
		ChatGLMConfig.history_num = history_num;
		await setChatGLMConfig(ChatGLMConfig);
		_this.reply("设置成功，当前记忆条数:"+ChatGLMConfig.history_num);
	}
	var answer_all_chat_off = async function(chat_msg,user_id,_this){
		ChatGLMConfig.answer_all_chat = false;
		await setChatGLMConfig(ChatGLMConfig);
		_this.reply("设置成功，关闭直接对话");
	}
	var answer_all_chat_on = async function(chat_msg,user_id,_this){
		ChatGLMConfig.answer_all_chat = true;
		await setChatGLMConfig(ChatGLMConfig);
		_this.reply("设置成功，开启直接对话，可能需要重启云崽才会生效");
	}

	var set_post_url = async function(post_url,user_id,_this){
		ChatGLMConfig.post_url = post_url;
		await setChatGLMConfig(ChatGLMConfig);
		_this.reply("设置成功，当前接口地址:"+ChatGLMConfig.post_url);
	}


	var get_history_with_character_to_post = async function(chat_msg,user_id,_this){
		var history_temp_arr = [];
		var chat_character = await _get_chat_character(user_id);
		//logger.info('[ChatGLM,send_msg，chat_character]', chat_character);
		if(chat_character){
			history_temp_arr.push(chat_character);
		}
		var history_to_post = await _get_history_to_post(user_id);
		if(!history_to_post){
			history_to_post = [];
		}
		if(history_to_post.length<=ChatGLMConfig.history_num){
			for(var i=0;i<history_to_post.length;i++){
				history_temp_arr.push(history_to_post[i]);
			}
		}else{
			for(var i=history_to_post.length-ChatGLMConfig.history_num;i<history_to_post.length;i++){
				history_temp_arr.push(history_to_post[i]);
			}
		}
		return history_temp_arr;
	}
	var clear_history_to_post = async function(chat_msg,user_id,_this){
		await _set_history_to_post(user_id,[]);
		_this.reply("清除下次发给ai的历史聊天成功");
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
			callback(error);
			logger.info('[ChatGLM,POST,error]',error)
		})
		req.write(data_str)
		req.end();
	}




	var chat_log_arr = null;
	var ws_send_arr = [];


	var send_msg = async function(msg,user_id,_this,callback){
		//设置ai的历史记忆
		var history_temp_arr = await get_history_with_character_to_post(msg,user_id,_this);
		post_data({"prompt": msg, "history": history_temp_arr},async function(ret_data){
			var ret_obj;
			try {
				ret_obj = JSON.parse(ret_data);
			} catch (error) {
				_this.reply(error);
				_this.reply(ret_data);
			}
			if(ret_obj && ret_obj.history){
				var chat_history_row = ret_obj.history[ret_obj.history.length-1];
				var chat_history = await _get_chat_history(user_id);
				if(!chat_history){
					chat_history = [];
				}
				chat_history.push(chat_history_row);
				//logger.info('[ChatGLM,chat_history]', chat_history);
				await _set_chat_history(user_id,chat_history);
				var history_to_post = await _get_history_to_post(user_id);
				if(!history_to_post){
					history_to_post = [];
				}
				var history_to_post_del_num = (history_to_post.length+1)-ChatGLMConfig.history_num;
				if(history_to_post_del_num>0){
					for(var i=0;i<history_to_post_del_num;i++){
						history_to_post.shift();
					}
				}
				history_to_post.push(chat_history_row);
				await _set_history_to_post(user_id,history_to_post);
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
		get_history_with_character_to_post:get_history_with_character_to_post,
		clear_history_to_post:clear_history_to_post,
		answer_all_chat_off:answer_all_chat_off,
		answer_all_chat_on:answer_all_chat_on,
		set_character:set_character,
		get_character:get_character,
		del_character:del_character,
		get_config_text:get_config_text,
		set_history_num:set_history_num,
		set_post_url:set_post_url,
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
			//logger.info('[用户信息，isMaster]', e.isMaster);//user_id 用户qq号
			function isMaster(e){
				return e.isMaster;
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
				ChatGLMWebSocket.send_msg(chat_msg,user_id,_this,function(res_msg){
					if(res_msg){
						_this.reply(res_msg);
					}
				});
			}

			async function set_history_num(chat_msg,user_id,_this,e){
				if(!isMaster(e)){
					_this.reply("只有主人能够进行这项配置");
					return;
				}
				if(isNumber(chat_msg)){
					chat_msg=parseInt(chat_msg);
					await ChatGLMWebSocket.set_history_num(chat_msg,user_id,_this);
				}else{
					_this.reply("末尾请输入数字，示例:"+ChatGLMWebSocket.get_config_text("set_history_num")+"3");
				}
			}
			function get_history_num(chat_msg,user_id,_this,e){
				_this.reply("当前记忆条数:"+ChatGLMConfig.history_num);
			}
			async function get_history_to_post(chat_msg,user_id,_this,e){
				var history = await ChatGLMWebSocket.get_history_with_character_to_post(chat_msg,user_id,_this);
				// logger.info('get_history_with_character_to_post,', history);//
				await _this.forwardMsg( _this,history,e );
			}
			async function clear_history_to_post(chat_msg,user_id,_this,e){
				await ChatGLMWebSocket.clear_history_to_post(chat_msg,user_id,_this);
			}
			async function answer_all_chat_off(chat_msg,user_id,_this,e){
				if(!isMaster(e)){
					_this.reply("只有主人能够进行这项配置");
					return;
				}
				await ChatGLMWebSocket.answer_all_chat_off(chat_msg,user_id,_this);
			}
			async function answer_all_chat_on(chat_msg,user_id,_this,e){
				if(!isMaster(e)){
					_this.reply("只有主人能够进行这项配置");
					return;
				}
				await ChatGLMWebSocket.answer_all_chat_on(chat_msg,user_id,_this);
			}
			async function set_post_url(chat_msg,user_id,_this,e){
				if(!isMaster(e)){
					_this.reply("只有主人能够进行这项配置");
					return;
				}
				if(chat_msg){
					await ChatGLMWebSocket.set_post_url(chat_msg,user_id,_this);
				}else{
					_this.reply("末尾请输入接口地址，示例:"+ChatGLMWebSocket.get_config_text("set_post_url")+"http://0.0.0.0:8000");
				}
			}
			function get_post_url(chat_msg,user_id,_this,e){
				if(!isMaster(e)){
					_this.reply("只有主人能够进行这项配置");
					return;
				}
				_this.reply("当前接口地址:"+ChatGLMConfig.post_url);
			}
			async function set_character(chat_msg,user_id,_this,e){
				await ChatGLMWebSocket.set_character(chat_msg,user_id,_this);
			}
			async function get_character(chat_msg,user_id,_this,msgInfo){
				var character = await ChatGLMWebSocket.get_character(chat_msg,user_id,_this);
				await _this.forwardMsg( _this, [character],msgInfo);
			}
			async function del_character(chat_msg,user_id,_this,e){
				await ChatGLMWebSocket.del_character(chat_msg,user_id,_this);
			}
			async function get_history(chat_msg,user_id,_this,msgInfo){
				var history = await ChatGLMWebSocket.get_history(chat_msg,user_id,_this);
				// logger.info('get_history,', history);//
				await _this.forwardMsg( _this,history,msgInfo );
				//_this.reply(JSON.stringify(await ChatGLMWebSocket.get_history(chat_msg,user_id,_this)));
			}
			async function del_history(chat_msg,user_id,_this,e){
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
						help(chat_msg,e.user_id,_this,e);
						break;
					case "chat":
						chat(chat_msg,e.user_id,_this,e);
						break;
					case "set_history_num":
						await set_history_num(chat_msg,e.user_id,_this,e);
						break;
					case "get_history_num":
						get_history_num(chat_msg,e.user_id,_this,e);
						break;
					case "get_history_to_post":
						await get_history_to_post(chat_msg,e.user_id,_this,e);
						break;
					case "clear_history_to_post":
						await clear_history_to_post(chat_msg,e.user_id,_this,e);
						break;
					case "answer_all_chat_off":
						await answer_all_chat_off(chat_msg,e.user_id,_this,e);
						break;
					case "answer_all_chat_on":
						await answer_all_chat_on(chat_msg,e.user_id,_this,e);
						break;
					case "set_post_url":
						await set_post_url(chat_msg,e.user_id,_this,e);
						break;
					case "get_post_url":
						get_post_url(chat_msg,e.user_id,_this,e);
						break;
					case "set_character":
						await set_character(chat_msg,e.user_id,_this,e);
						break;
					case "get_character":
						await get_character(chat_msg,e.user_id,_this,e);
						break;
					case "del_character":
						await del_character(chat_msg,e.user_id,_this,e);
						break;
					case "get_history":
						await get_history(chat_msg,e.user_id,_this,e);
						break;
					case "del_history":
						await del_history(chat_msg,e.user_id,_this,e);
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
					//_this.reply("您想使用的指令是这个吗:'"+key_rate_arr[0].text+"'"+'\n'+"如果需要所有指令及说明，请输入'"+ChatGLMWebSocket.get_config_text("help")+"'");
					_this.forwardMsg( _this,[
						["您想使用的指令是这个吗:"],
						[key_rate_arr[0].text],
						["如果需要所有指令及说明，请输入'"+ChatGLMWebSocket.get_config_text("help")+"'"],
					],e );
					//logger.info('[用户聊天,没有找到完全匹配的关键词前缀]', key_rate_arr);
				}
			}

			//不是#开头的字符串进来了可以直接触发聊天
			if(ChatGLMConfig.answer_all_chat && ChatGLMConfig.public_prefix != e.msg.substr(0,ChatGLMConfig.public_prefix.length)){
				if(!find_str_prefix_text){
					chat(chat_msg,e.user_id,_this,e);
				}
			}
		};
	}
	/**
	 * 折合消息
	 */
	makeMsg = ({ data,msgInfo }) => {
		const msgList = []
		for (let item of data) {
			if(item.length>1){
				msgList.push({
					message: item[0],
					/*我的昵称*/
					nickname: msgInfo.nickname,
					/*我的账号*/
					user_id: msgInfo.user_id,
				})
				msgList.push({
					message: item[1],
					/*我的昵称*/
					nickname: Bot.nickname,
					/*我的账号*/
					user_id: Bot.uin,
				})
			}else{
				msgList.push({
					message: item[0],
					/*我的昵称*/
					nickname: Bot.nickname,
					/*我的账号*/
					user_id: Bot.uin,
				})
			}
		}
		return msgList
	}
	/**
	 * @returns
	 */
	forwardMsg = async ( e, data,msgInfo ) => {
		/*制作合并转发消息以备发送*/
		await e.reply(await Bot.makeForwardMsg(this.makeMsg({ data,msgInfo })))
		return
	}
}







