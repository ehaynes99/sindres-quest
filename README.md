# Sindre's Quest

## Motivation

I've been in numerous debates with people of the last 8 years where people keep telling me that ES modules "are the future". Here we are 8 years later, and it's time to admit that the experiment didn't work.

To be clear, I'm not talking about ESM **syntax**. I think we're all mostly in agreement that static import/export are preferable. I'm talking about the **runtime implementation**. For example, TypeScript has been converting ESM syntax into commonjs modules for years. Your code can use ESM universally, but can still be used in a commonjs project. It's overwhelmingly more convenient to do so for nodejs projects.

The design of ES modules was finalized with full realization that it would be incompatible with ALL of the existing nodejs code out there. I contend that the spec could have been easily made to be compatible by the omission of a single feature: top-level `await`. ES modules are loaded asynchronously. This is part of the specification, and necessary to facilitate top-level `await`. It _could_ have been designed without that feature, and then the sync vs async could have been left up to the implementation. Browsers could have done it asynchronously, and node could have done it synchronously. Compatibility with existing nodejs projects could have worked with very minimal effort. Older projects could have chosen when/if to convert the `require` statements, but it would have allowed parity between the functionality of both. Adoption would have taken months, not decades.

These are the same arguments made for the transition from python2 -> python3, a transition that's still not complete after over 13 years. While you might be inclined to call that one "close enough", there are still many linux distros that include python2 by default, and still plenty of actively-maintained software that uses it

I've discussed this in more detail in a series of comments starting with: https://gist.github.com/joepie91/bca2fda868c1e8b2c2caf76af7dfcad3?permalink_comment_id=4657938#gistcomment-4657938

Sindre Sorhus is [one of the most prolific authors of npm packages](https://www.npmjs.com/~sindresorhus). He has made a deliberate attempt to shift the ecosystem by converting all of his active projects to be ESM only. This has led to many incompatibility problems (their solutions outlined in an [increasingly lengthy FAQ](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c?permalink_comment_id=3992076#gistcomment-3992076) about resolving these issues). It's definitely his prerogative, and I'm not intending to attack or insult him. However, I think it was misguided, particularly for libraries intended for exclusive use with nodejs. As a result, many people are still using older versions from before the ESM cutover. But, I don't want to base my ideas on opinion, nor do I expect random-dude-on-Internet to care about my opinion, so I wanted to gather objective metrics of how it's going. So I created a small script to find out the numbers...

## Behavior

As of this first version, it:
* downloads the list of all projects returned by the npmjs registry api's [search endpoint](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search) where author = `sindresorhus`
* downloads the extended metadata for each project from the registry api's [package endpoint](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage). This includes the tarball path of each version of each package
* downloads the tarball, extracts the `package.json`, and checks whether `type === 'module'`
* downloads the list of download counts for the last week, which is the same data as shows on the "versions" tab on a package's page on https://npmjs.com
* sums up the total of downloads, partitioned by ESM/commonjs, and prints out the totals

Note that npm described in their blog [how download counts work](https://blog.npmjs.org/post/92574016600/numeric-precision-matters-how-npm-download-counts-work.html). While this can't be 100% accurate, it's the best we can do with publicly available data.

## Results 
As of Nov 12, 2023, the results are as follows:
* number of packages: 857
* total number of versions: 8609
* total downloads: 6,167,976,795
* total downloads of ESM versions: 439,771,975
* total downloads of CJS versions: 5,728,204,820
* percentage of downloads that are ESM versions: 7.13%
