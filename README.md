# ChatGLM，ChatRWKV的api插件

#### 介绍

这是一个对接ChatGLM，ChatRWKV的聊天api的云崽bot插件

#### 安装教程

第 1 步：在云崽根目录下打开终端，运行

git clone --depth=1 https://gitee.com/394911284/chatztc.git ./plugins/chatztc/

第 2 步：
重启云崽服务

第 3 步：
配置接口地址，在qq聊天界面使用下面的命令进行设置

    #ai设置接口地址http://0.0.0.0:8000

第 4 步：（可选）手动进入目录修改可选一些配置文件，配置完需要重启云崽服务

	./plugins/chatztc/config/config.json

	"history_num": 3,//用来设置ai保存的历史聊天数量,数量太多可能会爆显存（设置了人设会额外发送一条在最前面）
	"automatic_suggestion_order": true,//当指令不正确时，是否进行建议
	"answer_all_chat": true,//是否让插件关闭直接对话，就是不能直接说'你好'，只能使用指令匹配'#ai:你好'
	"public_prefix": "#ai",//公共的指令头（和其他插件指令冲突时修改，或者改为自己觉得方便的指令头）


备注：更新项目代码方式为，进入项目目录，输入git pull指令

        cd ./plugins/chatztc/
        git pull


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
    
    #ai查看下次发送的历史聊天
        发给ai的历史包括设定的人设的对话和记忆条数内的几次对话
    
    #ai清除下次发送的历史聊天
        清除记忆条数内的几次对话，不清除人设，也不会清除聊天记录
    
    #ai关闭直接对话
        关闭不带前缀直接和ai对话，防止影响群友聊天或者其他插件，重启云崽之后可以彻底取消监听
    
    #ai开启直接对话
        开启不带前缀直接和ai对话，可能需要重启云崽才会生效
    
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



==============ChatGLM安装说明==============


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

==============ChatGLM安装说明==============



==============ChatRWKV安装说明==============



ChatRWKV懒人版python包
https://zhuanlan.zhihu.com/p/612879065

模型推荐使用这个（适合聊天，适合完成任务，包括写代码）
RWKV-4-Raven-7B-v7-ChnEng-20230404-ctx2048.pth
下载地址
https://huggingface.co/BlinkDL/rwkv-4-raven/tree/main


我写的api启动文件
api.py和启动的run_api.bat下载，放在ChatRWKV根目录
链接：https://pan.baidu.com/s/1s-F9YwBON-28R5e6PjqRIQ 
提取码：irvw


==============ChatRWKV安装说明==============


