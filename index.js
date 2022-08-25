// Copyright 2022 Anthony Mugendi
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const dayjs = require('dayjs'),
	glob = require('tiny-glob'),
	fs = require('fs'),
	dateOrder = require('date-order'),
	fireRead = require('/home/mugz/projects/node/my-modules/fire-read');

// toObject plugin
dayjs.extend(require('dayjs/plugin/toObject'));

// sort numbers...
const numSort = (a, b) => a - b;
//validators
const optsValidator = require('./lib/validate/opts');
const listValidator = require('./lib/validate/list');
const readValidator = require('./lib/validate/read');

class GetLogs {
	constructor(opts) {
		// validate
		optsValidator.validate(opts);

		//
		if (
			!fs.existsSync(opts.logsDir) ||
			!fs.statSync(opts.logsDir).isDirectory()
		) {
			throw new Error(`${opts.logsDir} is not a valid directory`);
		}

		// console.log(opts);
		this.options = opts;
	}

	#format_set(v, len = 2) {
		return Array.from(v)
			.map((v) => v.toString().padStart(len, '0'))
			.sort(numSort);
	}

	#make_glob_pattern(opts) {
		const { duration, nameFormat } = opts;
		const periods = {
			H: 'hour',
			D: 'day',
			W: 'week',
			M: 'month',
			Y: 'year',
		};

		// console.log({ format, duration });

		//
		let m = duration.match(/([0-9]+)\s*([A-Z])/);

		if (!m) throw new Error('Wrong duration formatting');

		let period = periods[m[2]] || 'day';
		let count = m[1];
		let since = dayjs().subtract(count, period);

		let daysCount = 0;
		let now = dayjs();
		let d, o;

		let patterns = {
			hour: new Set(),
			day: new Set(),
			month: new Set(),
			year: new Set(),
		};

		// console.log({m, count, period, since});

		while ((d = now.subtract(daysCount++, 'days')) && d.isAfter(since)) {
			o = d.toObject();

			patterns.hour.add(o.hours);
			patterns.day.add(o.date);
			patterns.month.add(o.months + 1);
			patterns.year.add(o.years);
		}

		for (let k in patterns) {
			patterns[k] = '{' + this.#format_set(patterns[k]).join(',') + '}';
		}

		// console.log(patterns);

		// now make the glob string...
		// 1st we get order of pattern
		let date_order = dateOrder(this.options.dateFormat);
		let orderedPat = [];

		for (let dateComp of date_order) {
			if (dateComp in patterns) {
				orderedPat.push(patterns[dateComp]);
			}
		}

		// make final glob pattern
		this.globPattern = nameFormat.replace(
			/\{date\}/i,
			orderedPat.join('-')
		);
	}

	async list(opts) {
		// validate
		listValidator.validate(opts);

		// console.log(opts);
		this.#make_glob_pattern(opts);

		let globOpts = {
			absolute: true,
			filesOnly: true,
			cwd: this.options.logsDir,
		};

		// glob
		// console.log(this.globPattern);
		this.files = await glob(this.globPattern, globOpts);

		// console.log(opts);

		// sort by ascending order always as a first step to:
		// - reverse for DESC sorting
		// - do nothing for ASC sorting
		this.files = this.files.sort();

		if (opts.sort == 'DESC') {
			this.files = this.files.reverse();
		}

		//
		return this.files;
	}

	async get(opts) {
		readValidator.validate(opts);

		await this.list(opts);

		// if no files
		if (this.files.length == 0 ) {
			// if there are no files...
			let resp = {
				files: {
					current: null,
					selected: [],
				},
				fileNum: 0,
				lineNum: 0,
				lines: null,
			};

			resp.read = () => resp;

			return resp;
		}

		// set default parser
		opts.parser =
			opts.parser ||
			function (v) {
				return v;
			};

		this.readOpts = {
			files: this.files,
			lines: opts.lines,
			parser: opts.parser,
		};

		return new fireRead(this.readOpts);
	}
}

module.exports = GetLogs;
