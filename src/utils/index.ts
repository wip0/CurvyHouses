export function chunkItems<T = any>(items: Array<T>, chunkSize: number): Array<Array<T>> {
    const clonedItems = [...items];
    const result = [];
    while (clonedItems.length > 0) {
        result.push(clonedItems.splice(0, chunkSize));
    }
    return result;
}

export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
