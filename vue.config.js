module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
    ? '/rescore/'
    : '/',
    chainWebpack: config => {
      config
        .plugin('html')
        .tap(args => {
            args[0].title = 'Anime Rescorer'
            return args
        })
    }
  }