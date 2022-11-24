import connect from 'database/connect'
import sgMail from '@sendgrid/mail'
import Users from 'database/schemas/users'
import Appointment from 'database/schemas/appointment'
import Schedule from 'database/schemas/schedule'
import Services from 'database/schemas/services'

export default async (req, res) => {
	const { method } = req
	sgMail.setApiKey(process.env.SENDGRID_API_KEY)
	await connect()

	switch (method) {
		case 'GET':
			try {
				const data = await Appointment.find({})
				res.status(200).send(data)
			} catch (error) {
				return res.status(400).send('request failed.')
			}

			break

		case 'POST':
			try {
				const { data } = req.body

				const s = await Schedule.findById({ _id: data.scheduleId })

				await Appointment.create({
					patient: {
						id: data.userId
					},
					services: data.services,
					schedule: {
						id: data.scheduleId
					},
					date: s.date,
					proof: data.proof,
					created: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
					updated: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
				})

				await Users.findByIdAndUpdate(
					{ _id: data.userId },
					{
						name: data.name,
						age: data.age,
						gender: data.gender,
						contact: data.contact,
						address: data.address,
						updated: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
					}
				)

				const schedule = await Schedule.findById({ _id: data.scheduleId })
				const number = schedule.patients.length + 1
				const time = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']

				schedule.patients.push({
					number: number,
					user: data.userId,
					time: time[schedule.patients.length]
				})

				await schedule.save()

				res.status(200).send('request success.')
			} catch (error) {
				return res.status(400).send('request failed.')
			}

			break

		case 'PATCH':
			try {
				const { id, data } = req.body

				const appointment = await Appointment.findById(id)
				const user = await Users.findById(appointment.patient.id)
				const schedule = await Schedule.findById(appointment.schedule.id)
				const service = await Services.findById({ _id: appointment.services })

				let number = 0

				const msg = {
					to: user.email,
					from: process.env.EMAIL_FROM,
					subject: 'We have received your partial payment successfully.',
					html: `<p>Dear Valued Customer,<br /><br />We have received your partial payment successfully through Gcash. Webform with the following details:<br /><br />Date filed: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}<br /><br />Date Schedule: ${schedule.date}<br /><br />Time of Schedule: ${data.time}<br /><br />Service: ${service.name}<br /><br />Amount of Service: ${service.price} Pesos<br/><br /><b>Note: Bring your vaccination card and wear your facemask on the day of your appointment.</b><br /><br /><b>Dr.Jevemille Pascual - Camilon Dental Clinic</b></p>`
				}

				await sgMail.send(msg)

				await Appointment.findByIdAndUpdate(
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
