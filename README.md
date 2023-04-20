# chatztc

#### 介绍

这是一个对接ChatGLM的聊天api的云崽bot插件

#### 安装教程

第 1 步：在云崽根目录下打开终端，运行

git clone --depth=1 https://gitee.com/394911284/chatztc.git ./plugins/chatztc/

第 2 步：复制示例配置，生成本地配置文件

cp ./plugins/chatztc/config/config.json.example ./plugins/chatztc/config/config.json

第 3 步：修改本地配置文件的ChatGLM的api的端口地址
./plugins/chatztc/config/config.json
配置项：
"post_url": "http://0.0.0.0:8000",

第 4 步：（可选）修改配置文件，是否让插件关闭直接对话，就是不能直接说'你好'，只能使用'#ai:你好'
./plugins/chatztc/config/config.json
配置项：
"answer_all_chat": true

第 5 步：
重启云崽服务

#### 使用说明

------ai指令列表------

#ai帮助

唤出ai帮助

#ai:

使用ChatGLM进行聊天,示例:#ai:你好

#ai设置记忆条数

用来设置ai保存的历史聊天数量,数量太多可能会爆显存。示例:#ai设置记忆条数3

#ai获取设置的记忆条数

用来获取ai保存的历史聊天数量

#ai将上次对白设置为人设

用来设置1条ai始终记得的历史聊天

#ai获取人设

用来获取ai始终记得的历史聊天

#ai删除人设

用来删除ai始终记得的历史聊天

#ailog

输出聊天历史

#aidellog

删除聊天历史



下面是实际使用效果：

![输入图片说明](QQ%E5%9B%BE%E7%89%8720230420190857.jpg)


ChatGLM官方项目地址
https://github.com/THUDM/ChatGLM-6B

