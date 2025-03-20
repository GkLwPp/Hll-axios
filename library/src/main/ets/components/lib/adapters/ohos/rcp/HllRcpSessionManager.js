import rcp from '@hms.collaboration.rcp';
class HllRcpSessionManager {
  static maxCacheSessions = 4;
  static sessionPools = {};

  static genSessionConfigKey(sessionConfig) {
    return JSON.stringify(sessionConfig);
  }

  static getSession(sessionConfig) {
    const key = HllRcpSessionManager.genSessionConfigKey(sessionConfig);

    if (HllRcpSessionManager.sessionPools[key]) {
      const cacheSession = HllRcpSessionManager.sessionPools[key];
      return cacheSession;
    } else if (Object.keys(HllRcpSessionManager.sessionPools).length < HllRcpSessionManager.maxCacheSessions) {
      const createAndCacheSession = rcp.createSession(sessionConfig);
      HllRcpSessionManager.sessionPools[key] = createAndCacheSession;
      return createAndCacheSession;
    } else {
      return rcp.createSession(sessionConfig);
    }
  }

  static releaseTmpSession(session) {
    let isCacheSession = false;
    for (const key in HllRcpSessionManager.sessionPools) {
      if (HllRcpSessionManager.sessionPools[key] === session) {
        isCacheSession = true;
        break;
      }
    }
    if (!isCacheSession) {
      session.close();
    }
  }

  static removeSession(session) {
    for (const key in HllRcpSessionManager.sessionPools) {
      if (HllRcpSessionManager.sessionPools[key] === session) {
        delete HllRcpSessionManager.sessionPools[key];
        session.close();
        break;
      }
    }
  }

  static destroyAllSessions() {
    for (const key in HllRcpSessionManager.sessionPools) {
      const session = HllRcpSessionManager.sessionPools[key];
      if (session) {
        session.close();
      }
    }
    HllRcpSessionManager.sessionPools = {};
  }
}

export default HllRcpSessionManager;