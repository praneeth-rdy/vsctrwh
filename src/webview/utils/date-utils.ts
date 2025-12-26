import { DateTime } from 'luxon';

/**
 * Utility to convert a Date object to epoch time (milliseconds since 1970-01-01)
 * @param date - The Date object to be converted.
 * @returns The epoch time as a number.
 */
export function dateToEpoch(date: Date): number {
	if (!(date instanceof Date)) {
		throw new TypeError('Expected a Date object');
	}
	return DateTime.fromJSDate(date).toMillis();
}

/**
 * Utility to convert epoch time to a Date object
 * @param epoch - The epoch time (milliseconds since 1970-01-01).
 * @returns A Date object representing the epoch time.
 */
export function epochToDate(epoch: number): Date {
	if (typeof epoch !== 'number') {
		throw new TypeError('Expected a number');
	}
	return DateTime.fromMillis(epoch).toJSDate();
}

/**
 * Converts epoch time to an object with date and time strings.
 * @param epoch - The epoch time (milliseconds since 1970-01-01).
 * @returns An object with { date: "DD-MM-YYYY", time: "hh:mm a" }.
 */
export function epochToDateTime(epoch: number): { date: string; time: string } {
	if (typeof epoch !== 'number' || isNaN(epoch)) {
		throw new TypeError('Expected a valid number');
	}

	const dt = DateTime.fromMillis(epoch);
	return {
		date: dt.toFormat('dd-MM-yyyy'),
		time: dt.toFormat('hh:mm a')
	};
}

/**
 * Utility to calculate the difference in days between two epoch times.
 * @param epoch1 - The first epoch time (in milliseconds).
 * @param epoch2 - The second epoch time (in milliseconds).
 * @returns The number of days of difference as an integer.
 */
export function epochDifferenceInDays(epoch1: number, epoch2: number): number {
	if (typeof epoch1 !== 'number' || typeof epoch2 !== 'number') {
		throw new TypeError('Expected numbers');
	}
	const dt1 = DateTime.fromMillis(epoch1);
	const dt2 = DateTime.fromMillis(epoch2);
	return Math.floor(Math.abs(dt2.diff(dt1, 'days').days));
}

/**
 * Function to add a specified number of days to an epoch time.
 * @param epoch - The original epoch time (in milliseconds).
 * @param days - The number of days to add.
 * @returns The new epoch time (in milliseconds) after adding the specified days.
 */
export function addDaysToEpoch(epoch: number, days: number): number {
	return DateTime.fromMillis(epoch).plus({ days }).toMillis();
}
/**
 * Converts epoch time to a human-readable date format.
 * @param epoch - The epoch time in milliseconds since 1970-01-01.
 * @param truncateYear - Optional. If true, displays year in 2-digit format. Default is false.
 * @param includeTime - Optional. If true, includes time in the output. Default is false.
 * @param timezone - Optional. IANA timezone string. If not provided, uses local timezone.
 * @returns A formatted date string (e.g., "Sep 30, 2024" or "Sep 30, 24" if truncateYear is true).
 * @throws {TypeError} If epoch is not a number.
 */

export function formatEpochToHumanReadable(
	epoch: number,
	options: {
		truncateYear?: boolean;
		includeDate?: boolean;
		includeTime?: boolean;
		timezone?: string;
	} = {
		truncateYear: false,
		includeDate: true,
		includeTime: false,
		timezone: 'Asia/Kolkata'
	}
): string {
	if (typeof epoch !== 'number') {
		throw new TypeError('Expected a number for epoch');
	}

	const dt = options.timezone
		? DateTime.fromMillis(epoch).setZone(options.timezone)
		: DateTime.fromMillis(epoch);

	const format = options.includeDate
		? `MMM d, ${options.truncateYear ? 'yy' : 'yyyy'} ${options.includeTime ? ', hh:mm a' : ''}`
		: `${options.includeTime ? 'hh:mm a' : ''}`;

	return dt.toFormat(format);
}

/**
 * Utility to get today's date as a Date object.
 * @returns A Date object representing today's date at 00:00:00 hours.
 */
export function getTodayDate(date: Date, timezone: string = 'Asia/Kolkata'): Date {
	return DateTime.fromJSDate(date).setZone(timezone).startOf('day').toJSDate();
}

/**
 * Calculates the number of days left between current timestamp and a reference timestamp
 * Returns positive days if reference is in future, negative if in past
 * Returns 1 for 0-24 hours, 2 for 24-48 hours, and so on
 * @param currentEpoch - Current timestamp in milliseconds
 * @param referenceEpoch - Reference timestamp in milliseconds to compare against
 * @returns Number of days left (can be negative if reference is in past)
 */
export function getDaysLeft(currentEpoch: number, referenceEpoch: number): number {
	if (typeof currentEpoch !== 'number' || typeof referenceEpoch !== 'number') {
		throw new TypeError('Expected numbers for timestamps');
	}

	const current = DateTime.fromMillis(currentEpoch);
	const reference = DateTime.fromMillis(referenceEpoch);
	const diffInDays = reference.diff(current, 'days').days;

	return diffInDays > 0 ? Math.ceil(diffInDays) : Math.floor(diffInDays);
}

/**
 * Converts milliseconds to a human readable duration string
 * @param epoch - Duration in milliseconds
 * @returns A formatted duration string (e.g., "2 days 3 hours 30 minutes" or "45 minutes").
 * Does not include months or years in the output.
 * @throws {TypeError} If epoch is not a number
 */
export function formatEpochToDuration(epoch: number): string {
	if (typeof epoch !== 'number') {
		throw new TypeError('Expected a number for epoch');
	}

	const duration = DateTime.fromMillis(epoch).diff(DateTime.fromMillis(0), [
		'days',
		'hours',
		'minutes'
	]);
	const { days, hours, minutes } = duration.toObject();

	const parts = [];
	if (days && days > 0) {
		parts.push(`${Math.floor(days)} d`);
	}
	if (hours && hours > 0) {
		parts.push(`${Math.floor(hours)} hr`);
	}
	if (minutes && minutes > 0) {
		parts.push(`${Math.floor(minutes)} min`);
	}

	return parts.join(' ');
}
/**
 * Checks if a given epoch time is within the next 24 hours and returns remaining time
 * @param epoch - The epoch time to check (in milliseconds)
 * @returns Object with hours, minutes and seconds left if within 24 hours, undefined otherwise
 */
export function getTimeLeftIfWithin24Hours(
	epoch: number
): { hours: number; minutes: number; seconds: number } | undefined {
	if (typeof epoch !== 'number') {
		throw new TypeError('Expected a number for epoch');
	}

	const now = DateTime.now();
	const target = DateTime.fromMillis(epoch);
	const diff = target.diff(now, ['hours', 'minutes', 'seconds']);
	const { hours, minutes, seconds } = diff.toObject();

	// Return undefined if target is in the past or more than 24 hours away
	if (
		hours == null ||
		minutes == null ||
		seconds == null ||
		hours < 0 ||
		minutes < 0 ||
		seconds < 0 ||
		hours >= 24
	) {
		return undefined;
	}

	return {
		hours: Math.floor(hours),
		minutes: Math.floor(minutes),
		seconds: Math.floor(seconds)
	};
}
/**
 * Converts a Date object to a different timezone
 * @param date - The Date object to convert
 * @param timezone - The IANA timezone string to convert to (e.g. 'America/New_York')
 * @returns A new Date object in the specified timezone
 * @throws {TypeError} If date is not a Date object or timezone is invalid
 */
export function convertDateToTimezone(date: Date, timezone: string): Date {
	if (!(date instanceof Date)) {
		throw new TypeError('Expected a Date object');
	}
	return DateTime.fromJSDate(date).setZone(timezone).toJSDate();
}

/**
 * Converts an epoch timestamp to a time string in the specified timezone
 * @param epoch - The epoch timestamp in milliseconds
 * @param timezone - Optional IANA timezone string (e.g. 'America/New_York'). Defaults to local timezone if not specified
 * @returns A formatted time string in the specified timezone
 * @throws {TypeError} If epoch is not a number
 */
export function formatEpochToTimeInTimezone(epoch: number, timezone?: string): string {
	if (typeof epoch !== 'number') {
		throw new TypeError('Expected a number for epoch');
	}
	const dt = DateTime.fromMillis(epoch);
	return timezone ? dt.setZone(timezone).toFormat('h:mm a') : dt.toFormat('h:mm a');
}

/**
 * Gets a human readable time difference string (e.g. "2 years ago", "5 days left")
 * @param epoch - The epoch timestamp in milliseconds to compare against
 * @param referenceTime - Optional reference timestamp to compare with. Defaults to current time
 * @returns A formatted string describing the time difference
 * @throws {TypeError} If epoch is not a number
 */
export function getReadableTimeDifference(epoch: number, referenceTime?: number): string {
	if (typeof epoch !== 'number') {
		throw new TypeError('Expected a number for epoch');
	}

	const reference = referenceTime ? DateTime.fromMillis(referenceTime) : DateTime.now();
	const target = DateTime.fromMillis(epoch);
	const diff = target.diff(reference, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']);
	const { years, months, days, hours, minutes, seconds } = diff.toObject();

	const isFuture = target > reference;
	const suffix = isFuture ? 'left' : 'ago';

	if (years && Math.abs(years) >= 1) {
		return `${Math.abs(Math.floor(years))} year${Math.abs(years) !== 1 ? 's' : ''} ${suffix}`;
	}
	if (months && Math.abs(months) >= 1) {
		return `${Math.abs(Math.floor(months))} month${Math.abs(months) !== 1 ? 's' : ''} ${suffix}`;
	}
	if (days && Math.abs(days) >= 1) {
		return `${Math.abs(Math.floor(days))} day${Math.abs(days) !== 1 ? 's' : ''} ${suffix}`;
	}
	if (hours && Math.abs(hours) >= 1) {
		return `${Math.abs(Math.floor(hours))} hour${Math.abs(hours) !== 1 ? 's' : ''} ${suffix}`;
	}
	if (minutes && Math.abs(minutes) >= 1) {
		return `${Math.abs(Math.floor(minutes))} minute${Math.abs(minutes) !== 1 ? 's' : ''} ${suffix}`;
	}
	return `${Math.abs(Math.floor(seconds || 0))} second${Math.abs(Math.floor(seconds || 0)) !== 1 ? 's' : ''} ${suffix}`;
}

/**
 * Utility to convert an ISO date string to epoch time (milliseconds since 1970-01-01)
 * @param dateString - The ISO date string to be converted (e.g. "2025-02-21T11:06:39.3718194Z")
 * @returns The epoch time as a number.
 * @throws {TypeError} If dateString is not a string or is invalid
 */
export function epochFromDateString(dateString: string): number {
	if (typeof dateString !== 'string') {
		throw new TypeError('Expected a string for dateString');
	}

	const dt = DateTime.fromISO(dateString);
	if (!dt.isValid) {
		throw new TypeError('Invalid date string format');
	}

	return dt.toMillis();
}

/**
 * Formats duration or calculates duration between two timestamps.
 *
 * - If called with one argument (duration in ms): returns "Xs" (legacy) or "Xm"/"Xh Ym" if long
 * - If called with two arguments (start and end timestamps): returns "M:SS"
 *
 * @param durationOrStart - Duration in ms or Start time in ms
 * @param endTime - Optional end time in ms
 * @returns Formatted duration string
 */
export const formatDuration = (durationOrStart?: number, endTime?: number): string => {
	if (typeof durationOrStart !== 'number') {
		return '';
	}

	let durationMs: number;

	if (typeof endTime === 'number') {
		durationMs = endTime - durationOrStart;
		if (durationMs < 0) {
			return '0:00';
		}

		const minutes = Math.floor(durationMs / (1000 * 60));
		const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	durationMs = durationOrStart;
	const totalSeconds = Math.floor(durationMs / 1000);
	const totalMinutes = Math.floor(totalSeconds / 60);
	const totalHours = Math.floor(totalMinutes / 60);

	if (totalHours > 0) {
		const remainingMinutes = totalMinutes % 60;
		return remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours}h`;
	}

	if (totalMinutes > 0) {
		return `${totalMinutes}m`;
	}

	return `${totalSeconds}s`;
};

/**
 * Formats minutes to a human-readable duration string
 * @param minutes - Duration in minutes
 * @returns A formatted duration string (e.g., "30 minutes", "1 hour 30 minutes", "2 hours")
 */
export const formatMinutesToDuration = (minutes: number): string => {
	if (typeof minutes !== 'number' || minutes < 0) {
		return '0 minutes';
	}

	if (minutes === 0) {
		return '0 minutes';
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours > 0) {
		if (remainingMinutes === 0) {
			return `${hours} hour${hours !== 1 ? 's' : ''}`;
		} else {
			return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
		}
	}

	return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

export const formatDateForInput = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Checks if an interview's start time has passed
 * @param startTimeEpoch - The interview start time in epoch milliseconds
 * @returns true if the start time has passed, false otherwise
 */
export const isTimePassed = (startTimeEpoch: number): boolean => {
	if (typeof startTimeEpoch !== 'number') {
		throw new TypeError('Expected a number for startTimeEpoch');
	}

	const now = DateTime.now().toMillis();
	return now >= startTimeEpoch;
};

/**
 * Formats a date string into a localized date format
 * @param dateString - Date string in ISO format or similar
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDate = (dateString: string): string => {
	try {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	} catch (error) {
		console.warn('Invalid date string:', dateString);
		return 'Invalid Date';
	}
};

/**
 * Formats a date object into a localized date string
 * @param date - Date object to format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatLastUpdated = (date: Date): string => {
	return date.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
};

/**
 * Validates if a date string is valid
 * @param dateString - Date string to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Formats a date string into chart data with day name and full date
 * @param dateString - Date string to format
 * @returns Object with day, date, and fullDate properties
 */
export const formatDateForChart = (
	dateString: string
): {
	day: string;
	date: string;
	fullDate: string;
} => {
	const dateObj = new Date(dateString);

	// Check if date is valid
	if (isNaN(dateObj.getTime())) {
		return {
			day: 'Invalid',
			date: dateString,
			fullDate: `Invalid ${dateString}`
		};
	}

	const dayName = dateObj.toLocaleDateString('en-US', {
		weekday: 'short'
	});

	return {
		day: dayName,
		date: dateString,
		fullDate: `${dayName} ${dateString}`
	};
};

/**
 * Formats a timestamp into separate date and time strings
 * @param timestamp - Timestamp in milliseconds
 * @returns Object with date (DD-MM-YYYY) and time (HH:MM) strings
 */
export const formatDateTime = (timestamp: number): { date: string; time: string } => {
	const date = new Date(timestamp);
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	const dateStr = `${day}-${month}-${year}`;
	const timeStr = date.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
	return { date: dateStr, time: timeStr };
};
