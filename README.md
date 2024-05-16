## typeorm mysql
pnpm install --save @nestjs/typeorm typeorm mysql2
## ValidationPipe 请求体 做校验
pnpm install --save class-validator class-transformer
## 安装 redis
pnpm install --save redis
## 发送 email 验证码
pnpm install nodemailer --save
## 配置 抽离
pnpm install --save @nestjs/config
##  jwt 模块
pnpm install --save @nestjs/jwt
# 登录 访问接口 鉴权
nest g guard login --flat --no-spec
nest g guard permission --flat --no-spec
# 返回格式拦截器  访问接口记录拦截器
nest g interceptor format-response --flat \n
nest g interceptor invoke-record --flat
# 修改下对 HttpException 的处理逻辑
nest g filter custom-exception --flat