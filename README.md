# chatztc

#### 介绍
ChatGLM
#### 安装教程

第 1 步：下载插件
在云崽根目录下打开终端，运行

git clone --depth=1 https://gitee.com/394911284/chatztc.git ./plugins/chatztc/

然后重启云崽服务

#### 使用说明

1.复制本地配置配置文件
cp ./plugins/chatztc/config/config.json.example ./plugins/chatztc/config/config.json

2.修改本地配置配置文件的ChatGLM的api的端口地址
./plugins/chatztc/config/config.json

"post_url": "http://0.0.0.0:8000",


3.修改配置文件，是否让插件关闭直接对话，就是不需要使用'#ai:你好'，而是直接说'你好',默认是开启的
./plugins/chatztc/config/config.json

"answer_all_chat": true

#### 参与贡献

#### 特技

