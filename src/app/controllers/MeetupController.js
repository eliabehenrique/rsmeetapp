import * as Yup from 'yup';
import { isBefore } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string()
        .min(5)
        .required(),
      description: Yup.string()
        .min(10)
        .required(),
      location: Yup.string()
        .min(10)
        .required(),
      date: Yup.date()
        .min(new Date(), 'Date past invalid')
        .required(),
      banner_id: Yup.number()
        .min(1)
        .required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails' });

    const banner = await File.findByPk(req.body.banner_id);

    if (!banner) return res.status(400).json({ error: 'Banner not found' });
    if (banner.type !== 2)
      return res.status(400).json({ error: 'Banner invalid' });

    const meetup = await Meetup.create({
      ...req.body,
      organizer_id: req.userId,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string()
        .min(5)
        .required(),
      description: Yup.string()
        .min(10)
        .required(),
      location: Yup.string()
        .min(10)
        .required(),
      date: Yup.date()
        .min(new Date(), 'Date past invalid')
        .required(),
      banner_id: Yup.number()
        .min(1)
        .required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails' });

    const banner = await File.findByPk(req.body.banner_id);

    if (!banner) return res.status(400).json({ error: 'Banner not found' });

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) return res.status(400).json({ error: 'Meetup not found' });

    if (req.userId !== meetup.organizer_id)
      return res
        .status(401)
        .json({ error: "You aren't organizer this Meetup" });

    const meetupUpdated = await meetup.update(req.body);

    return res.json(meetupUpdated);
  }

  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        organizer_id: req.userId,
        date: {
          [Op.gte]: new Date(),
        },
      },
      order: ['date'],
    });

    return res.json(meetups);
  }

  async destroy(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) return res.status(400).json({ error: 'Meetup not found' });

    if (req.userId !== meetup.organizer_id)
      return res
        .status(401)
        .json({ error: "You aren't organizer this Meetup" });

    if (isBefore(meetup.date, new Date()))
      return res
        .status(400)
        .json({ error: 'Meetup has already been completed' });

    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
