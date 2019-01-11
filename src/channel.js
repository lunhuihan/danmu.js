/**
 * [Channel 弹幕轨道控制]
 * @type {Class}
 */
class Channel {
  constructor (danmu) {
    this.danmu = danmu
    this.reset()
    let self = this
    this.danmu.on('bullet_remove', function (r) {
      self.removeBullet(r.bullet)
    })
    this.containerPos = this.danmu.container.getBoundingClientRect()
    this.containerWidth = this.containerPos.width
    this.containerHeight = this.containerPos.height
    this.containerLeft = this.containerPos.left
    this.containerRight = this.containerPos.right
    // this.player.on('timeupdate', function () {
    this.danmu.bulletResizeTimer = setInterval(function () {
      self.containerPos = self.danmu.container.getBoundingClientRect()
      if (Math.abs(self.containerPos.width - self.containerWidth) >= 2 || Math.abs(self.containerPos.height - self.containerHeight) >= 2 || Math.abs(self.containerPos.left - self.containerLeft) >= 2 || Math.abs(self.containerPos.right - self.containerRight) >= 2) {
        // console.log('新播放器宽度：' + self.containerPos.width)
        // console.log('旧播放器宽度：' + self.playerWidth)
        // console.log('新播放器高度：' + self.containerPos.height)
        // console.log('旧播放器高度：' + self.playerHeight)
        // console.log('新播放器左：' + self.containerPos.left)
        // console.log('旧播放器左：' + self.playerLeft)
        // console.log('新播放器右：' + self.containerPos.right)
        // console.log('旧播放器右：' + self.playerRight)
        self.containerWidth = self.containerPos.width
        self.containerHeight = self.containerPos.height
        self.containerLeft = self.containerPos.left
        self.containerRight = self.containerPos.right
        self.resize()
      }
    }, 50);
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(item => {
      document.addEventListener(item, function () {
        self.resize(true)
      })
    })
  }
  resize (isFullscreen = false) {
    let container = this.danmu.container
    let self = this
    setTimeout(function () {
      if (self.danmu.bulletBtn.main.data) {
        self.danmu.bulletBtn.main.data.forEach(item => {
          if (item.bookChannelId) {
            delete item['bookChannelId']
            // console.log('resize导致' + item.id + '号优先弹幕预定取消')
          }
        })
      }
      // console.log('resize导致所有轨道恢复正常使用')
      let size = container.getBoundingClientRect()
      self.width = size.width
      self.height = size.height
      if (self.danmu.config.area && self.danmu.config.area.start >= 0 && self.danmu.config.area.end >= self.danmu.config.area.start) {
        self.height = self.height * (self.danmu.config.area.end - self.danmu.config.area.start)
      }
      self.container = container
      let fontSize = /mobile/ig.test(navigator.userAgent) ? 10 : 12
      let channelSize = Math.floor(self.height / fontSize)
      let channels = []
      for (let i = 0; i < channelSize; i++) {
        channels[i] = {
          id: i,
          queue: {
            scroll: [],
            top: [],
            bottom: []
          },
          operating: {
            scroll: false,
            top: false,
            bottom: false
          },
          bookId: {}
        }
      }
      if (self.channels && self.channels.length <= channels.length) {
        for (let i = 0; i < self.channels.length; i++) {
          channels[i] = {
            id: i,
            queue: {
              scroll: [],
              top: [],
              bottom: []
            },
            operating: {
              scroll: false,
              top: false,
              bottom: false
            },
            bookId: {}
          };
          ['scroll', 'top'].forEach(key => {
            self.channels[i].queue[key].forEach(item => {
              if (item.el) {
                channels[i].queue[key].push(item)
                item.pauseMove(self.containerPos, isFullscreen)
                item.startMove(self.containerPos)
              }
            })
          })
          self.channels[i].queue['bottom'].forEach(item => {
            if (item.el) {
              channels[i + channels.length - self.channels.length].queue['bottom'].push(item)
              if(item.channel_id[0] + item.channel_id[1] - 1 === i) {
                let channel_id = [].concat(item.channel_id)
                item.channel_id = [channel_id[0] - self.channels.length + channels.length, channel_id[1]]
                item.top = item.channel_id[0] * fontSize
                if (self.danmu.config.area && self.danmu.config.area.start) {
                  item.top += self.containerHeight * self.danmu.config.area.start
                }
                item.topInit()
              }
              item.pauseMove(self.containerPos, isFullscreen)
              item.startMove(self.containerPos)
            }
          })
        }
      } else if (self.channels && self.channels.length > channels.length) {
        for (let i = 0; i < channels.length; i++) {
          channels[i] = {
            id: i,
            queue: {
              scroll: [],
              top: [],
              bottom: []
            },
            operating: {
              scroll: false,
              top: false,
              bottom: false
            },
            bookId: {}
          };
          ['scroll', 'top', 'bottom'].forEach(key => {
            if (key === 'top' && i > Math.floor(channels.length / 2)) {

            } else if (key === 'bottom' && i <= Math.floor(channels.length / 2)) {

            } else {
              let num = key === 'bottom' ? i - channels.length + self.channels.length : i
              self.channels[num].queue[key].forEach((item, index) => {
                if (item.el) {
                  channels[i].queue[key].push(item)
                  if(key === 'bottom') {
                    if(item.channel_id[0] + item.channel_id[1] - 1 === num) {
                      let channel_id = [].concat(item.channel_id)
                      item.channel_id = [channel_id[0] - self.channels.length + channels.length, channel_id[1]]
                      item.top = item.channel_id[0] * fontSize
                      if (self.danmu.config.area && self.danmu.config.area.start) {
                        item.top += self.containerHeight * self.danmu.config.area.start
                      }
                      item.topInit()
                    }
                  }
                  item.pauseMove(self.containerPos, isFullscreen)
                  item.startMove(self.containerPos)
                }
                self.channels[num].queue[key].splice(index, 1)
              })
            }
          })
        }
        for (let i = channels.length; i < self.channels.length; i++) {
          ['scroll', 'top', 'bottom'].forEach(key => {
            self.channels[i].queue[key].forEach(item => {
              item.pauseMove(self.containerPos)
              item.remove()
            })
          })
        }
      }
      self.channels = channels
      self.channelHeight = fontSize
    }, 10)
  }
  addBullet (bullet) {
    // if (bullet.prior) {
      // console.log(bullet.id + '号优先弹幕请求注册')
    // }
    let self = this
    let danmu = this.danmu
    let channels = this.channels
    let channelHeight = this.channelHeight
    let occupy = Math.ceil(bullet.height / channelHeight)
    if (occupy > channels.length) {
      return {
        result: false,
        message: `exceed channels.length, occupy=${occupy},channelsSize=${channels.length}`
      }
    } else {
      let flag = true, channel, pos = -1
      for (let i = 0, max = channels.length; i < max; i++) {
        if (channels[i].queue[bullet.mode].some(item => item.id === bullet.id)) {
          return {
            result: false,
            message: `exsited, channelOrder=${i},danmu_id=${bullet.id}`
          }
        }
      }
      if(bullet.mode === 'scroll') {
        for (let i = 0, max = channels.length - occupy; i <= max; i++) {
          flag = true
          for (let j = i; j < i + occupy; j++) {
            channel = channels[j]
            if (channel.operating.scroll) {
              flag = false
              break
            }
            if ((channel.bookId.scroll || bullet.prior) && (channel.bookId.scroll !== bullet.id)) {
              flag = false
              break
            }
            channel.operating.scroll = true
            let curBullet = channel.queue.scroll[0]
            if (curBullet) {
              let curBulletPos = curBullet.el.getBoundingClientRect()
              if (curBulletPos.right > self.containerPos.right) {
                flag = false
                channel.operating.scroll = false
                break
              }

              // Vcur * t + Scur已走 - Widthcur = Vnew * t
              // t = (Scur已走 - Widthcur) / (Vnew - Vcur)
              // Vnew * t < Widthplayer
              let curS = curBulletPos.left - self.containerPos.left + curBulletPos.width
              let curV = (self.containerPos.width + curBulletPos.width) / curBullet.duration
              let curT = curS / curV

              let newS = self.containerPos.width
              let newV = (self.containerPos.width + bullet.width) / bullet.duration
              let newT = newS / newV

              if (!danmu.config.bOffset) {
                danmu.config.bOffset = 0
              }
              if (curV < newV && curT + danmu.config.bOffset > newT) {
                flag = false
                channel.operating.scroll = false
                break
              }
            }
            channel.operating.scroll = false
          }
          if (flag) {
            pos = i
            break
          }
        }
      } else if (bullet.mode === 'top') {
        for (let i = 0, max = channels.length - occupy; i <= max; i++) {
          flag = true
          for (let j = i; j < i + occupy; j++) {
            if(j > Math.floor(channels.length / 2)) {
              flag = false
              break
            }
            channel = channels[j]
            if (channel.operating[bullet.mode]) {
              flag = false
              break
            }
            if ((channel.bookId[bullet.mode] || bullet.prior) && (channel.bookId[bullet.mode] !== bullet.id)) {
              flag = false
              break
            }
            channel.operating[bullet.mode] = true
            if (channel.queue[bullet.mode].length > 0) {
              flag = false
              channel.operating[bullet.mode] = false
              break
            }
            channel.operating[bullet.mode] = false
          }
          if (flag) {
            pos = i
            break
          }
        }
      } else if (bullet.mode === 'bottom') {
        for (let i = channels.length - occupy; i >= 0; i--) {
          flag = true
          for (let j = i; j < i + occupy; j++) {
            if(j <= Math.floor(channels.length / 2)) {
              flag = false
              break
            }
            channel = channels[j]
            if (channel.operating[bullet.mode]) {
              flag = false
              break
            }
            if ((channel.bookId[bullet.mode] || bullet.prior) && (channel.bookId[bullet.mode] !== bullet.id)) {
              flag = false
              break
            }
            channel.operating[bullet.mode] = true
            if (channel.queue[bullet.mode].length > 0) {
              flag = false
              channel.operating[bullet.mode] = false
              break
            }
            channel.operating[bullet.mode] = false
          }
          if (flag) {
            pos = i
            break
          }
        }
      }

      if (pos !== -1) {
        for (let i = pos, max = pos + occupy; i < max; i++) {
          channel = channels[i]
          channel.operating[bullet.mode] = true
          channel.queue[bullet.mode].unshift(bullet)
          if (bullet.prior) {
            delete channel.bookId[bullet.mode]
            // console.log(i + '号轨道恢复正常使用')
          }
          channel.operating[bullet.mode] = false
        }
        if (bullet.prior) {
          // console.log(bullet.id + '号优先弹幕运行完毕')
          delete bullet['bookChannelId']
          let dataList = danmu.bulletBtn.main.data
          dataList.some(function (item) {
            if (item.id === bullet.id) {
              delete item['bookChannelId']
              return true
            } else {
              return false
            }
          })
        }
        bullet.channel_id = [pos, occupy]
        bullet.top = pos * channelHeight
        if (self.danmu.config.area && self.danmu.config.area.start) {
          bullet.top += self.containerHeight * self.danmu.config.area.start
        }
        return {
          result: bullet,
          message: 'success'
        }
      } else {
        if (bullet.prior) {
          if (!bullet.bookChannelId) {
            pos = -1
            for (let i = 0, max = channels.length - occupy; i <= max; i++) {
              flag = true
              for (let j = i; j < i + occupy; j++) {
                if (channels[j].bookId[bullet.mode]) {
                  flag = false
                  break
                }
              }
              if (flag) {
                pos = i
                break
              }
            }
            if (pos !== -1) {
              for (let j = pos; j < pos + occupy; j++) {
                channels[j].bookId[bullet.mode] = bullet.id
                // console.log(j + '号轨道被' + bullet.id + '号优先弹幕预定')
              }
              let nextAddTime = 2
              let dataList = danmu.bulletBtn.main.data
              dataList.some(function (item) {
                if (item.id === bullet.id) {
                  // console.log(bullet.id + '号优先弹幕将于' + nextAddTime + '秒后再次请求注册')
                  item.start += nextAddTime * 1000
                  item.bookChannelId = [pos, occupy]
                  // console.log(bullet.id + '号优先弹幕预定了' + pos + '~' + pos + occupy - 1 + '号轨道')
                  // console.log(`${bullet.id}号优先弹幕预定了${pos}~${pos + occupy - 1}号轨道`)
                  return true
                } else {
                  return false
                }
              })
            }
          } else {
            let nextAddTime = 2
            let dataList = danmu.bulletBtn.main.data
            dataList.some(function (item) {
              if (item.id === bullet.id) {
                // console.log(bullet.id + '号优先弹幕将于' + nextAddTime + '秒后再次请求注册')
                item.start += nextAddTime * 1000
                return true
              } else {
                return false
              }
            })
          }
        }
        return {
          result: false,
          message: 'no surplus will right'
        }
      }
    }
  }
  removeBullet (bullet) {
    let channels = this.channels
    let channelId = bullet.channel_id
    let channel
    for (let i = channelId[0], max = channelId[0] + channelId[1]; i < max; i++) {
      channel = channels[i]
      if (channel) {
        channel.operating[bullet.mode] = true
        let i = -1
        channel.queue[bullet.mode].some((item, index) => {
          if (item.id === bullet.id) {
            i = index
            return true
          }
        })
        if (i > -1) {
          channel.queue[bullet.mode].splice(i, 1)
        }
        channel.operating[bullet.mode] = false
      }
    }
  }
  reset () {
    let container = this.danmu.container
    let self = this
    if (self.channels && self.channels.length > 0) {
      ['scroll', 'top', 'bottom'].forEach(key => {
        for (let i = 0; i < self.channels.length; i++) {
          self.channels[i].queue[key].forEach(item => {
            item.pauseMove(self.containerPos)
            item.remove()
          })
        }
      })
    }
    setTimeout(function () {
      let size = container.getBoundingClientRect()
      self.width = size.width
      self.height = size.height
      if (self.danmu.config.area && self.danmu.config.area.start >= 0 && self.danmu.config.area.end >= self.danmu.config.area.start) {
        self.height = self.height * (self.danmu.config.area.end - self.danmu.config.area.start)
      }
      self.container = container
      let fontSize = /mobile/ig.test(navigator.userAgent) ? 10 : 12
      let channelSize = Math.floor(self.height / fontSize)
      let channels = []
      for (let i = 0; i < channelSize; i++) {
        channels[i] = {
          id: i,
          queue: {
            scroll: [],
            top: [],
            bottom: []
          },
          operating: {
            scroll: false,
            top: false,
            bottom: false
          },
          bookId: {}
        }
      }
      self.channels = channels
      self.channelHeight = fontSize
    }, 200)
  }
  resetWithCb (cb, main) {
    let container = this.danmu.container
    let self = this
    if (self.channels && self.channels.length > 0) {
      ['scroll', 'top', 'bottom'].forEach(key => {
        for (let i = 0; i < self.channels.length; i++) {
          self.channels[i].queue[key].forEach(item => {
            item.pauseMove(self.containerPos)
            item.remove()
          })
        }
      })
    }
    let size = container.getBoundingClientRect()
    self.width = size.width
    self.height = size.height
    if (self.danmu.config.area && self.danmu.config.area.start >= 0 && self.danmu.config.area.end >= self.danmu.config.area.start) {
      self.height = self.height * (self.danmu.config.area.end - self.danmu.config.area.start)
    }
    self.container = container
    let fontSize = /mobile/ig.test(navigator.userAgent) ? 10 : 12
    let channelSize = Math.floor(self.height / fontSize)
    let channels = []
    for (let i = 0; i < channelSize; i++) {
      channels[i] = {
        id: i,
        queue: {
          scroll: [],
          top: [],
          bottom: []
        },
        operating: {
          scroll: false,
          top: false,
          bottom: false
        },
        bookId: {}
      }
    }
    self.channels = channels
    self.channelHeight = fontSize
    if (cb) {
      cb(true, main)
    }
  }
}

export default Channel