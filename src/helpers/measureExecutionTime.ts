export default async function measureExecutionTime(
	callback: () => Promise<any>
) {
	const startExecutionDate = new Date();
	await callback();
	const finalExecutionDate = new Date();
	const count = finalExecutionDate.getTime() - startExecutionDate.getTime();
	return { startExecutionDate, finalExecutionDate, count };
}
