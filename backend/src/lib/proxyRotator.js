// backend/src/lib/proxyRotator.js
export class ProxyRotator {
  constructor() {
    this.proxies = process.env.PROXY_LIST.split(',')
    this.currentIndex = 0
    this.failedProxies = new Set()
  }
  
  async getProxy() {
    // Rotate through working proxies
    let attempts = 0
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length
      
      if (!this.failedProxies.has(proxy)) {
        const working = await this.testProxy(proxy)
        if (working) return proxy
        this.failedProxies.add(proxy)
      }
      attempts++
    }
    
    // If all proxies fail, use TOR
    return 'socks5://127.0.0.1:9050'
  }
  
  async testProxy(proxy) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
        agent: new HttpsProxyAgent(proxy)
      })
      
      clearTimeout(timeout)
      const data = await response.json()
      console.log(`Proxy ${proxy} works, IP: ${data.ip}`)
      return true
    } catch (error) {
      return false
    }
  }
  
  async makeRequest(url, options = {}) {
    const proxy = await this.getProxy()
    const agent = new HttpsProxyAgent(proxy)
    
    return fetch(url, {
      ...options,
      agent,
      headers: {
        ...options.headers,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    })
  }
}