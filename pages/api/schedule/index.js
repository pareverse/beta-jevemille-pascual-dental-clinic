import connect from 'database/connect'
import Schedule from 'database/schemas/schedule'
import Users from 'database/schemas/users'
import sgMail from '@sendgrid/mail'

export default async (req, res) => {
	const { method } = req
	await connect()
	sgMail.setApiKey(process.env.SENDGRID_API_KEY)

	switch (method) {
		case 'GET':
			try {
				const data = await Schedule.find({}).sort({ createdAt: -1 })
				res.status(200).send(data)
			} catch (error) {
				return res.status(400).send('request failed.')
			}

			break

		case 'POST':
			try {
				const { data } = req.body

				await Schedule.create({
					...data,
					created: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
					updated: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
				})

				res.status(200).send('request success.')
			} catch (error) {
				return res.status(400).send('request failed.')
			}

			break

		case 'PATCH':
			try {
				const { id, data } = req.body

				const schedule = await Schedule.findById({ _id: id })

				console.log(req.body)

				if (!data.status) {
					let email = []

					schedule.patients.map(async (sched) => {
						const user = await Users.findById({ _id: sched.user })

						const msg = {
							to: user.email,
							from: process.env.EMAIL_FROM,
							subject: 'We have rejected your scheduled appointment.',
							html: '<p>We have rejected your scheduled appointment due to an emergency. We are hoping for your consideration. Your money will be refunded to your Gcash account right away.</p><br/><br/><b>Note: Sorry for canceling your scheduled appointment. We hope to reach out to you on the next free day.</b><br /><br /><b>Dr. Jevemille Pascual-Camilon Dental Clinic</>'
						}

						sgMail.send(msg)
					})
				}

				await Schedule.findByIdAndUpdate(
					{ _id: id },
					{
						...data,
						updated: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
					}
				)

				res.status(200).send('request success.')
			} catch (error) {
				return res.status(400).send('request failed.')
			}

			break

		case 'DELETE':
			try {
				const { id } = req.body

				await Schedule.findByIdAndDelete({
					_id: id
				})

				res.status(200).send('request success.')
			} catch (error) {
				return res.status(400).send('request failed.')
			}

			break

		default:
			res.status(400).send('request failed.')
			break
	}
}
