import { z } from "zod";

export interface ValidationResult {
	isValid: boolean;
	message?: string;
	length: number;
	maxLength: number;
}

export class ContentValidator {
	static validateMainCardContent(content: string): ValidationResult {
		const maxLength = 4000;
		const length = content.length;

		if (length > maxLength) {
			return {
				isValid: false,
				message: `Main card content exceeds ${maxLength} character limit. Current: ${length}`,
				length,
				maxLength,
			};
		}

		return {
			isValid: true,
			length,
			maxLength,
		};
	}

	static validateAppendContent(content: string): ValidationResult {
		const maxLength = 200;
		const length = content.length;

		if (length > maxLength) {
			return {
				isValid: false,
				message: `Append content exceeds ${maxLength} character limit. Current: ${length}`,
				length,
				maxLength,
			};
		}

		return {
			isValid: true,
			length,
			maxLength,
		};
	}

	static validateCardId(cardId: string): ValidationResult {
		const maxLength = 50;
		const length = cardId.length;

		// 验证卡片ID格式: 数字.数字或字母序列
		const isValidFormat = /^\d+(\.\d+[a-z]*)*$/.test(cardId);

		if (!isValidFormat) {
			return {
				isValid: false,
				message: `Invalid card ID format. Expected format like "1.1a2b"`,
				length,
				maxLength,
			};
		}

		if (length > maxLength) {
			return {
				isValid: false,
				message: `Card ID exceeds ${maxLength} character limit. Current: ${length}`,
				length,
				maxLength,
			};
		}

		return {
			isValid: true,
			length,
			maxLength,
		};
	}
}

// Zod schemas for input validation
export const mainCardContentSchema = z.string().max(4000, {
	message: "Main card content must be 4000 characters or less",
});

export const appendContentSchema = z.string().max(200, {
	message: "Append content must be 200 characters or less",
});

export const cardIdSchema = z
	.string()
	.max(50, {
		message: "Card ID must be 50 characters or less",
	})
	.regex(/^\d+(\.\d+[a-z]*)*$/, {
		message: "Card ID must follow format like '1.1a2b'",
	});

export const errorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.any().optional(),
	}),
});

