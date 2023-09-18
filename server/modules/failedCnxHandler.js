// use "addFailedAttempt" for every failed connection attempt,
// if more than maxFails in less time (ms) than failsMaxAge,
// "onMaxFailedCnx" is called which can for instance be replaced by
// a mail alert for the admin, and "canTryAgain" is blocked for blockTime ms
class FailedCnxHandler {
  constructor(maxFails, failMaxAge, blockTime) {
    this.maxFails = maxFails;
    this.failMaxAge = failMaxAge;
    this.blockTime = blockTime;
    this.failedCnxs = [];
    this.blocked = false;
  }

  clearOldFailedCnxs() {
    const currentTime_UTC_ms = new Date().getTime();
    this.failedCnxs.forEach((cnx, idx) => {
      if (currentTime_UTC_ms - cnx.UTC_ms > this.failMaxAge)
        this.failedCnxs.splice(idx, 1);
    });
  }

  clearFailedCnx() {
    this.failedCnxs = [];
  }

  addFailedAttemps(data) {
    this.clearOldFailedCnxs();
    this.failedCnxs.push({ UTC_ms: new Date().getTime(), data });
    if (this.failedCnxs.length >= this.maxFails) {
      this.block();
      this.onMaxFailedCnx();
    }
  }

  block() {
    this.blocked = true;
    this.blockedAt = new Date().getTime();
    setTimeout(() => {
      this.blocked = false;
    }, this.blockTime);
  }

  getRemainingBlockTime() {
    if (!this.blocked) return 0;
    let remainingTime_ms =
      this.blockTime - (new Date().getTime() - this.blockedAt);

    const hours = Math.floor(remainingTime_ms / 3600_000);
    const minutes = Math.floor(remainingTime_ms / 60_000) % 60;
    const seconds = Math.floor(remainingTime_ms / 1000) % 60;

    return `${hours}h ${minutes}min ${seconds}s`;
  }

  canTryAgain() {
    this.clearOldFailedCnxs();
    return !this.blocked && this.failedCnxs.length < this.maxFails;
  }

  onMaxFailedCnx() {}
}

module.exports = FailedCnxHandler;
