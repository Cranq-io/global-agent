import matcher from 'matcher';
import {
  UnexpectedStateError,
} from '../errors';

const DIGIT_ONLY_REGEX = /^(?:\d+\.){3}\d+$/;

export default (subjectUrl: string, noProxy: string) => {
  const subjectUrlTokens = new URL(subjectUrl);

  const rules = noProxy.split(/[\s,]+/);

  for (const rule of rules) {
    // 特殊处理 DIGIT_ONLY 符号
    if (rule.startsWith('DIGIT_ONLY')) {
      const [, port] = rule.split(':');

      return DIGIT_ONLY_REGEX.test(subjectUrlTokens.hostname) && (port ? subjectUrlTokens.port === port : true);
    }

    const ruleMatch = rule
      .replace(/^(?<leadingDot>\.)/, '*')
      .match(/^(?<hostname>.+?)(?::(?<port>\d+))?$/);

    if (!ruleMatch || !ruleMatch.groups) {
      throw new UnexpectedStateError('Invalid NO_PROXY pattern.');
    }

    if (!ruleMatch.groups.hostname) {
      throw new UnexpectedStateError('NO_PROXY entry pattern must include hostname. Use * to match any hostname.');
    }

    const hostnameIsMatch = matcher.isMatch(subjectUrlTokens.hostname, ruleMatch.groups.hostname);

    if (hostnameIsMatch && (!ruleMatch.groups || !ruleMatch.groups.port || subjectUrlTokens.port && subjectUrlTokens.port === ruleMatch.groups.port)) {
      return true;
    }
  }

  return false;
};
