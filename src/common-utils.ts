/**
 * 获取格式化的当前时间字符串，包括年月日时分秒和毫秒。
 * @returns {string} 格式化的当前时间。
 */
export function getFormattedTime() {
    const now = new Date()
    // 获取年月日小时分钟秒和毫秒
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // getMonth() 返回的月份从0开始，所以需要加1
    const day = now.getDate()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const milliseconds = now.getMilliseconds()

    // 格式化月份、日期、小时、分钟、秒和毫秒，不足两位数的前面补零
    const formattedMonth = month.toString().padStart(2, '0')
    const formattedDay = day.toString().padStart(2, '0')
    const formattedHours = hours.toString().padStart(2, '0')
    const formattedMinutes = minutes.toString().padStart(2, '0')
    const formattedSeconds = seconds.toString().padStart(2, '0')
    const formattedMilliseconds = milliseconds.toString().padStart(3, '0')

    // 组合成最终的字符串
    const formattedTime = `${year}-${formattedMonth}-${formattedDay} ${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`
    return formattedTime
}

/**
 * 获取格式化的当前时间字符串，包括年月日时分秒，时间用点号分隔
 * @returns {string} 格式化的当前时间。
 */
export function getFormattedTime1() {
	const now = new Date()
	// 获取年月日小时分钟秒和毫秒
	const year = now.getFullYear()
	const month = now.getMonth() + 1 // getMonth() 返回的月份从0开始，所以需要加1
	const day = now.getDate()
	const hours = now.getHours()
	const minutes = now.getMinutes()
	const seconds = now.getSeconds()
  
	// 格式化月份、日期、小时、分钟、秒和毫秒，不足两位数的前面补零
	const formattedMonth = month.toString().padStart(2, '0')
	const formattedDay = day.toString().padStart(2, '0')
	const formattedHours = hours.toString().padStart(2, '0')
	const formattedMinutes = minutes.toString().padStart(2, '0')
	const formattedSeconds = seconds.toString().padStart(2, '0')
  
	// 组合成最终的字符串
	const formattedTime = `${year}-${formattedMonth}-${formattedDay}.${formattedHours}.${formattedMinutes}.${formattedSeconds}`
	return formattedTime
}