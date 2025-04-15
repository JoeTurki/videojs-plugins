import videojs from 'video.js';
import generate from 'videojs-generate-rollup-config';
import replace from '@rollup/plugin-replace';
import type { RollupOptions } from 'rollup';

interface RollupContext {
  version?: string;
}

/**
 * Generate Rollup configuration for Video.js plugins
 * @param context - Build context containing version information
 * @returns Rollup configuration array
 */
export default function rollupConfig(context: RollupContext): RollupOptions[] {
  // Determine the package version
  const version = context.version ?? process.env.npm_package_version;

  // Validate version format
  if (typeof version === 'string') {
    // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
    const versionRegex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

    if (!versionRegex.test(version)) {
      throw new Error(
        'The provided version string does not comply with the Semantic Versioning (SemVer) format required.' +
        ' Please refer to https://semver.org/ for more details on the SemVer specification.'
      );
    }
    videojs.log('Building version: ' + version);
  } else {
    throw new Error('Version is undefined or not a string.');
  }

  const options = {
    plugins(defaults: string[]) {
      defaults.unshift('replace');
      return defaults;
    },
    primedPlugins(defaults: Record<string, any>) {
      // Replace variable in the code, here used for versioning
      defaults.replace = replace({
        __libVersion__: "'" + version + "'",
        preventAssignment: true
      });
      return defaults;
    }
  };

  const config = generate(options, context);
  return Object.values(config.builds);
}
