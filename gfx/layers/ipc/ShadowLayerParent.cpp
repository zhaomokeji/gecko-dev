/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 * vim: sw=2 ts=8 et :
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "ShadowLayerParent.h"
#include "Layers.h"                     // for Layer, ContainerLayer
#include "nsDebug.h"                    // for NS_RUNTIMEABORT
#include "nsISupportsImpl.h"            // for Layer::AddRef, etc

#include "mozilla/layers/PaintedLayerComposite.h"
#include "mozilla/layers/CanvasLayerComposite.h"
#include "mozilla/layers/ColorLayerComposite.h"
#include "mozilla/layers/ImageLayerComposite.h"
#include "mozilla/layers/ContainerLayerComposite.h"

namespace mozilla {
namespace layers {

ShadowLayerParent::ShadowLayerParent() : mLayer(nullptr)
{
}

ShadowLayerParent::~ShadowLayerParent()
{
  Disconnect();
}

void
ShadowLayerParent::Disconnect()
{
  if (mLayer) {
    mLayer->Disconnect();
    mLayer = nullptr;
  }
}

void
ShadowLayerParent::Bind(Layer* layer)
{
  if (mLayer != layer) {
    Disconnect();
    mLayer = layer;
  }
}

void
ShadowLayerParent::Destroy()
{
  // It's possible for Destroy() to come in just after this has been
  // created, but just before the transaction in which Bind() would
  // have been called.  In that case, we'll ignore shadow-layers
  // transactions from there on and never get a layer here.
  Disconnect();
}

ContainerLayer*
ShadowLayerParent::AsContainerLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_CONTAINER
         ? static_cast<ContainerLayer*>(mLayer.get())
         : nullptr;
}

CanvasLayer*
ShadowLayerParent::AsCanvasLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_CANVAS
         ? static_cast<CanvasLayer*>(mLayer.get())
         : nullptr;
}

ColorLayer*
ShadowLayerParent::AsColorLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_COLOR
         ? static_cast<ColorLayer*>(mLayer.get())
         : nullptr;
}

ImageLayer*
ShadowLayerParent::AsImageLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_IMAGE
         ? static_cast<ImageLayer*>(mLayer.get())
         : nullptr;
}

RefLayer*
ShadowLayerParent::AsRefLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_REF
         ? static_cast<RefLayer*>(mLayer.get())
         : nullptr;
}

PaintedLayer*
ShadowLayerParent::AsPaintedLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_PAINTED
    ? static_cast<PaintedLayer*>(mLayer.get())
         : nullptr;
}

TextLayer*
ShadowLayerParent::AsTextLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_TEXT
         ? static_cast<TextLayer*>(mLayer.get())
         : nullptr;
}

BorderLayer*
ShadowLayerParent::AsBorderLayer() const
{
  return mLayer && mLayer->GetType() == Layer::TYPE_BORDER
         ? static_cast<BorderLayer*>(mLayer.get())
         : nullptr;
}

void
ShadowLayerParent::ActorDestroy(ActorDestroyReason why)
{
  switch (why) {
  case AncestorDeletion:
    MOZ_CRASH("shadow layer deleted out of order!");
    return;                     // unreached

  case Deletion:
    // See comment near Destroy() above.
    Disconnect();
    break;

  case AbnormalShutdown:
    Disconnect();
    break;

  case NormalShutdown:
    // let IPDL-generated code automatically clean up Shmems and so
    // forth; our channel is disconnected anyway
    break;

  case FailedConstructor:
    MOZ_CRASH("FailedConstructor isn't possible in PLayerTransaction");
    return;                     // unreached
  }

  mLayer = nullptr;
}

} // namespace layers
} // namespace mozilla
