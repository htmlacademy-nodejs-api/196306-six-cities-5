import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { BaseController, HttpMethod, ValidateObjectIdMiddleware } from '../../libs/rest/index.js';
import { Logger } from '../../libs/logger/index.js';
import { Component } from '../../types/index.js';
import { fillDTO } from '../../helpers/index.js';
import { OfferService } from './offer-service.interface.js';
import { OfferPreviewRdo } from './rdo/offer-preview.rdo.js';
import { CreateOfferRequest } from './type/create-offer-request.type.js';
import { parseAsInteger } from '../../helpers/parse.js';
import { OfferRdo } from './rdo/offer.rdo.js';
import { HttpError } from '../../libs/rest/index.js';
import { StatusCodes } from 'http-status-codes';
import { DocumentType } from '@typegoose/typegoose';
import { OfferEntity } from './offer.entity.js';
import { UpdateOfferRequest } from './type/update-offer-request.type.js';
import { ParamOfferId } from './type/param-offerid.type.js';
import { CommentService } from '../comment/index.js';
import { CommentRdo } from '../comment/rdo/comment.rdo.js';

const DEFAULT_OFFER_AMOUNT = 60;
const PREMIUM_OFFER_AMOUNT = 3;

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.CommentService) private readonly commentService: CommentService,
  ) {
    super(logger);

    this.logger.info('Registering routes for OfferController…');

    this.addRoute({
      path: '/',
      method: HttpMethod.Get,
      handler: this.index,
    });
    this.addRoute({
      path: '/',
      method: HttpMethod.Post,
      handler: this.create,
    });
    this.addRoute({ path: '/premium', method: HttpMethod.Get, handler: this.premium });
    this.addRoute({ path: '/favorites', method: HttpMethod.Get, handler: this.favorites });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Get,
      handler: this.show,
      middlewares: [new ValidateObjectIdMiddleware('offerId')],
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Patch,
      handler: this.update,
      middlewares: [new ValidateObjectIdMiddleware('offerId')],
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Delete,
      handler: this.delete,
      middlewares: [new ValidateObjectIdMiddleware('offerId')],
    });
    this.addRoute({
      path: '/:offerId/favorite',
      method: HttpMethod.Put,
      handler: this.favorite,
      middlewares: [new ValidateObjectIdMiddleware('offerId')],
    });
    this.addRoute({
      path: '/:offerId/comments',
      method: HttpMethod.Get,
      handler: this.getComments,
      middlewares: [new ValidateObjectIdMiddleware('offerId')],
    });
  }

  private transformOffer(offer: DocumentType<OfferEntity>) {
    return Object.assign(offer, { isFavorite: false, rating: offer.rating ?? 0 });
  }

  public async index({ query }: Request, res: Response): Promise<void> {
    // TODO: get user id and take isFavorite from offer.favoredByUsers
    const amount = Math.max(parseAsInteger(query.limit) ?? 0, DEFAULT_OFFER_AMOUNT);
    const offers = await this.offerService
      .find(amount)
      .then((offerDocuments) => offerDocuments.map((offer) => this.transformOffer(offer)));
    const responseData = fillDTO(OfferPreviewRdo, offers);
    this.ok(res, responseData);
  }

  public async create({ body }: CreateOfferRequest, res: Response): Promise<void> {
    const result = await this.offerService.create(body);
    this.created(res, fillDTO(OfferRdo, result));
  }

  public async show({ params }: Request<ParamOfferId>, res: Response): Promise<void> {
    const { offerId } = params;
    const offer = await this.offerService.findById(offerId);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, `Offer with id ${params.offerId} does not exist`, 'OfferController');
    }

    const responseData = fillDTO(OfferRdo, this.transformOffer(offer));
    this.ok(res, responseData);
  }

  public async update({ params, body }: UpdateOfferRequest, res: Response): Promise<void> {
    const { offerId } = params;
    const updatedOffer = await this.offerService.updateById(offerId, body);

    if (!updatedOffer) {
      throw new HttpError(StatusCodes.NOT_FOUND, `Offer with id ${offerId} not found.`, 'OfferController');
    }

    this.ok(res, fillDTO(OfferRdo, this.transformOffer(updatedOffer)));
  }

  public async delete({ params }: Request<ParamOfferId>, res: Response): Promise<void> {
    const { offerId } = params;
    const deletedOffer = await this.offerService.deleteById(offerId);

    if (!deletedOffer) {
      throw new HttpError(StatusCodes.NOT_FOUND, `Offer with id ${offerId} not found.`, 'OfferController');
    }

    await this.commentService.deleteByOfferId(offerId);

    this.noContent(res, null);
  }

  public async premium({ query }: Request, res: Response): Promise<void> {
    if (!query.city) {
      throw new HttpError(StatusCodes.BAD_REQUEST, `${query.city} is not a valid city name`, 'OfferController');
    }

    const offers = await this.offerService
      .findPremiumByCity(query.city as string, PREMIUM_OFFER_AMOUNT)
      .then((offerDocuments) => offerDocuments.map((offer) => this.transformOffer(offer)));

    const responseData = fillDTO(OfferPreviewRdo, offers);
    this.ok(res, responseData);
  }

  public async favorites(_req: Request, _res: Response): Promise<void> {
    throw new HttpError(StatusCodes.NOT_IMPLEMENTED, 'Not implemented', 'OfferController');
  }

  public async favorite(_req: Request, _res: Response): Promise<void> {
    throw new HttpError(StatusCodes.NOT_IMPLEMENTED, 'Not implemented', 'OfferController');
  }

  public async getComments({ params }: Request<ParamOfferId>, res: Response): Promise<void> {
    if (!(await this.offerService.exists(params.offerId))) {
      throw new HttpError(StatusCodes.NOT_FOUND, `Offer with id ${params.offerId} not found.`, 'OfferController');
    }

    const comments = await this.commentService.findByOfferId(params.offerId);
    this.ok(res, fillDTO(CommentRdo, comments));
  }
}