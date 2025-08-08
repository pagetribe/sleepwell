require('@testing-library/jest-dom');

// Mock ResizeObserver for recharts and other libraries that require it
if (typeof window !== 'undefined') {
	window.ResizeObserver = window.ResizeObserver || class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
