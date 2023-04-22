# ChatGLM的api插件

#### 介绍

这是一个对接ChatGLM的聊天api的云崽bot插件

#### 安装教程

第 1 步：在云崽根目录下打开终端，运行

git clone --depth=1 https://gitee.com/394911284/chatztc.git ./plugins/chatztc/

第 2 步：
重启云崽服务

第 3 步：
配置接口地址，在qq聊天界面使用下面的命令进行设置

    #ai设置接口地址http://0.0.0.0:8000

第 4 步：（可选）手动进入目录修改可选一些配置文件，
./plugins/chatztc/config/config.json

	"history_num": 3,//用来设置ai保存的历史聊天数量,数量太多可能会爆显存（设置了人设会额外发送一条在最前面）
	"automatic_suggestion_order": true,//当指令不正确时，是否进行建议
	"answer_all_chat": true,//是否让插件关闭直接对话，就是不能直接说'你好'，只能使用指令匹配'#ai:你好'
	"public_prefix": "#ai",//公共的指令头（和其他插件指令冲突时修改，或者改为自己觉得方便的指令头）



#### qq聊天界面使用说明

    ------ai指令列表------
    
    #ai帮助
        唤出ai帮助

    #ai:
        使用ChatGLM进行聊天,示例:#ai:你好
    
    #ai设置接口地址
        用来设置api接口地址
    
    #ai读取接口地址
        用来查看api接口地址
    
    #ai设置记忆条数
        用来设置ai保存的历史聊天数量,示例:#ai设置记忆条数3
    
    #ai获取设置的记忆条数
        用来获取ai保存的历史聊天数量
    
    #ai设置人设
        将上次对白设置为人设，会将上次的对白添加在历史聊天的顶部
    
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



ChatGLM秋叶大神的整合包在这里
https://www.bilibili.com/video/BV1E24y1u7Go/?spm_id_from=333.999.0.0&vd_source=69701cb5cfa769975f4fcee38b58440f



int4量化模型下载(能优化显存为6G，8G显存的显卡能快速运行)


链接：https://pan.baidu.com/s/1izUy6i7XsaSwu9xLTgrufA 
提取码：kg3g

下载后放到秋叶大神的整合包的这个目录下
ChatGLM-webui\model\chatglm-6b-int4


api.py和启动的bat下载，放在ChatGLM-webui根目录
链接：https://pan.baidu.com/s/1uOkhGRt3ZF00nDZxrsQ6Tw 
提取码：64jt



最后，ChatGLM官方项目地址
https://github.com/THUDM/ChatGLM-6B


